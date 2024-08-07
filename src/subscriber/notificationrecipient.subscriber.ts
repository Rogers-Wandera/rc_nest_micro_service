import { Utilities } from 'src/app/utils/app.utils';
import { NotificationRecipient } from 'src/entities/core/notificationrecipient.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RecoverEvent,
} from 'typeorm';

@EventSubscriber()
export class NotificationRecipientSubscriber
  implements EntitySubscriberInterface<NotificationRecipient>
{
  utils: Utilities = new Utilities();
  constructor() {}
  listenTo() {
    return NotificationRecipient;
  }

  beforeInsert(event: InsertEvent<NotificationRecipient>) {
    const body = event.entity;
    body.recipientHash = this.utils.Hash(body.recipient);
    body.recipient = this.utils.encryptData(body.recipient);
    event.entity = body;
  }

  beforeRecover(event: RecoverEvent<NotificationRecipient>) {
    const body = event.entity;
    body.recipient = this.utils.decryptData(body.recipient);
    event.entity = body;
  }

  afterLoad(entity: NotificationRecipient) {
    if (entity.recipient) {
      entity.recipient = this.utils.decryptData(entity.recipient);
    }
  }
}
