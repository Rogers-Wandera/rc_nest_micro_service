import { Utilities } from 'src/app/utils/app.utils';
import { NotificationResendRecipients } from 'src/entities/core/notificationresendrecipient.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RecoverEvent,
} from 'typeorm';

@EventSubscriber()
export class NotificationResendRecipientSubscriber
  implements EntitySubscriberInterface<NotificationResendRecipients>
{
  utils: Utilities = new Utilities();
  constructor() {}
  listenTo() {
    return NotificationResendRecipients;
  }

  beforeInsert(event: InsertEvent<NotificationResendRecipients>) {
    const body = event.entity;
    body.recipientHash = this.utils.Hash(body.recipient);
    body.recipient = this.utils.encryptData(body.recipient);
    event.entity = body;
  }

  beforeRecover(event: RecoverEvent<NotificationResendRecipients>) {
    console.log('beforeRecover', event.entity);
    const body = event.entity;
    body.recipient = this.utils.decryptData(body.recipient);
    event.entity = body;
  }

  afterLoad(entity: NotificationResendRecipients) {
    if (entity.recipient) {
      entity.recipient = this.utils.decryptData(entity.recipient);
    }
  }
}
