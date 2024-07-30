import { Inject, Injectable } from '@nestjs/common';
import {
  Message,
  MessagingPayload,
  MulticastMessage,
} from 'firebase-admin/lib/messaging/messaging-api';
import { FireBaseService } from 'src/db/firebase.setup';
import { RTechSystemNotificationType } from '../types/notify.types';
import { ClientProxy } from '@nestjs/microservices';
import { NOTIFICATION_PATTERN } from 'src/app/patterns/notification.patterns';

@Injectable()
export class RTECHPushNotificationService {
  constructor(
    @Inject('FIREBASE_SERVICE') private readonly firebase: FireBaseService,
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy,
  ) {}
  public sendMessage(message: Message) {
    return this.firebase.admin.messaging().send(message);
  }
  public sendToTopic(topic: string, message: MessagingPayload) {
    return this.firebase.admin.messaging().sendToTopic(topic, message);
  }
  public sendMultiCast(message: MulticastMessage) {
    return this.firebase.admin.messaging().sendEachForMulticast(message);
  }

  public async sendSystemNotification(data: RTechSystemNotificationType) {
    return this.client.emit(
      { cmd: NOTIFICATION_PATTERN.SYSTEM_NOTIFICATION },
      data,
    );
  }
}
