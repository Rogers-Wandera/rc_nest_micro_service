import { Controller, Logger, UseInterceptors } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
  RpcException,
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

@Controller('notifications')
export class NotificationController {
  private logger = new Logger();
  constructor(
    private readonly service: NotificationService,
    private readonly resendservice: NotificationResendService,
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
      channel.ack(originalMsg);
      return response;
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
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    if (data.resendId) {
      await this.resendservice.ReconcileResend(data);
    } else {
      await this.service.SendEventMessage(data);
    }
    channel.ack(originalMsg);
    return 'Notification sent successfully';
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
      channel.ack(originalMsg);
      return 'Login notification sent successfully';
    } catch (error) {
      this.logger.debug(error.message);
      throw new RpcException(error);
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
      throw new RpcException(error);
    }
  }
}
