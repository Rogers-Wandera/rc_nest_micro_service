import { Utilities } from 'src/app/utils/app.utils';
import { NotificationResendMedia } from 'src/entities/core/notificationresendbodymedia.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RecoverEvent,
} from 'typeorm';

@EventSubscriber()
export class NotificationResendMediaSubscriber
  implements EntitySubscriberInterface<NotificationResendMedia>
{
  utils: Utilities = new Utilities();
  constructor() {}
  listenTo() {
    return NotificationResendMedia;
  }

  beforeInsert(event: InsertEvent<NotificationResendMedia>) {
    const body = event.entity;
    body.url = this.utils.encryptData(body.url);
    event.entity = body;
  }

  beforeRecover(event: RecoverEvent<NotificationResendMedia>) {
    const body = event.entity;
    body.url = this.utils.decryptData(body.url);
    event.entity = body;
  }
  afterLoad(entity: NotificationResendMedia) {
    if (entity.url) {
      entity.url = this.utils.decryptData(entity.url);
    }
  }
}
