import { Controller, Inject, Logger, UseInterceptors } from '@nestjs/common';
import {
  ClientProxy,
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { NotificationService } from './notification/notification.service';
import { JoiValidator } from 'src/app/contexts/interceptors/joi.interceptor';
import { notificationSchema } from './notification/notification.schema';
import {
  NotificationOptions,
  RTechSystemNotificationType,
} from '@notifier/rtechnotifier/types/notify.types';
import { NOTIFICATION_PATTERN } from 'src/app/patterns/notification.patterns';
import { Retry } from 'src/app/decorators/retry.decorator';
import { NotificationResendService } from './notificationresend/notificationresend.service';
import { Message, Channel } from 'amqplib';
import { NotificationData } from './notification/notification.type';
import { NOTIFICATION_TYPE } from 'src/app/types/app.types';
import { InjectIoClientProvider, IoClient } from 'nestjs-io-client';

@Controller('notifications')
export class NotificationController {
  private logger = new Logger();
  constructor(
    private readonly service: NotificationService,
    private readonly resendservice: NotificationResendService,
    @InjectIoClientProvider()
    private readonly io: IoClient,
    @Inject('NOTIFICATION_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  @UseInterceptors(new JoiValidator(notificationSchema))
  @MessagePattern({ cmd: NOTIFICATION_PATTERN.NOTIFY })
  @Retry(2)
  async HandleNotifications(
    @Payload() data: NotificationOptions,
    @Ctx() context: RmqContext,
  ) {
    try {
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      const response = await this.service.sendNotification(data);
      if (Object.keys(response.data).length > 0) {
        response.data.createdBy = data.createdBy || 'system';
        if (data.type === 'email' || data.type === 'sms') {
          response.data.command = NOTIFICATION_PATTERN.NOTIFY;
          response.data.pattern = NOTIFICATION_PATTERN.NOTIFY;
          await this.service.SaveSystemNotification(response.data);
        }
      }
      channel.ack(originalMsg);
      return 'Notification sent successfully';
    } catch (error) {
      throw error;
    }
  }

  @EventPattern({ cmd: NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION })
  @Retry(2)
  async HandleSystemNotification(
    @Payload() data: RTechSystemNotificationType,
    @Ctx() context: RmqContext,
  ) {
    try {
      const channel = context.getChannelRef();
      const originalMsg = context.getMessage();
      if (data.resendId) {
        await this.resendservice.ReconcileResend(data);
      } else {
        await this.service.SendEventMessage(data);
      }
      channel.ack(originalMsg);
      return 'Notification sent successfully';
    } catch (error) {
      this.logger.debug(error.message);
      // throw new RpcException(error);
    }
  }

  @EventPattern({ cmd: NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION_SENT })
  async HandleSentSystemNotification(
    @Payload() data: RTechSystemNotificationType,
    @Ctx() context: RmqContext,
  ) {
    try {
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      const senddata: NotificationData = {
        type: NOTIFICATION_TYPE.PUSH_SYSTEM,
        notificationType: data.type,
        pattern: data.pattern,
        priority: data.priority,
        createdBy: data.createdBy || 'system',
        data: data.data,
        recipient:
          data.recipient.type === 'no broadcast'
            ? data.recipient.recipients
            : [{ to: 'broadcast' }],
        command: NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION_SENT,
      };
      await this.service.SaveSystemNotification(senddata);
      channel.ack(originalMsg);
      return 'Notification sent successfully';
    } catch (error) {
      this.logger.debug(error.message);
      // throw new RpcException(error);
    }
  }

  @EventPattern({ cmd: NOTIFICATION_PATTERN.USER_LOGGED_IN })
  @Retry(2)
  async HandleLogin(
    @Payload() data: { userId: string },
    @Ctx() context: RmqContext,
  ) {
    try {
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      const userresends =
        await this.resendservice.GetRecipientResendNotification(data.userId);
      if (userresends) {
        for (const resend of userresends) {
          await this.service.SendEventMessage(resend);
        }
      }
      this.rabbitClient.emit(NOTIFICATION_PATTERN.USER_NOTIFICATIONS, {
        userId: data.userId,
      });
      channel.ack(originalMsg);
      return 'Login notification sent successfully';
    } catch (error) {
      this.logger.debug(error.message);
      // throw new RpcException(error);
    }
  }

  @EventPattern({ cmd: NOTIFICATION_PATTERN.RESEND })
  @Retry(1)
  async HandleNotificationResend(
    @Payload() data: RTechSystemNotificationType,
    @Ctx() context: RmqContext,
  ) {
    try {
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      if (data.resendId) {
        await this.resendservice.ReconcileResend(data, 'resend');
      } else {
        await this.resendservice.ResendSystemNotification(data);
      }
      channel.ack(originalMsg);
      return 'Notification reschedule successfully';
    } catch (error) {
      this.logger.debug(error.message);
      // throw new RpcException(error);
    }
  }

  @MessagePattern({ cmd: NOTIFICATION_PATTERN.HEALTHY_CHECK })
  HandleHealthyCheck(@Payload() data: string, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as Message;
    channel.ack(originalMsg);
    return `[${data}] is up and running`;
  }

  @EventPattern({ cmd: NOTIFICATION_PATTERN.USER_LOGGED_OUT })
  HandleUserLogout(
    @Payload() data: { userId: string },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as Message;
    this.io.emit(NOTIFICATION_PATTERN.USER_OFFLINE, data);
    channel.ack(originalMsg);
  }

  @EventPattern(NOTIFICATION_PATTERN.USER_NOTIFICATIONS)
  async HandleGetUserNotififcations(
    @Payload() data: { userId: string },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as Message;
    const response = await this.service.getUserSystemNotifications(data.userId);
    this.io.emit(NOTIFICATION_PATTERN.USER_NOTIFICATIONS, {
      data: response,
      userId: data.userId,
    });
    channel.ack(originalMsg);
  }
}
