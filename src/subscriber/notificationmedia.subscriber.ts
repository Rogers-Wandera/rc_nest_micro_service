import { Utilities } from 'src/app/utils/app.utils';
import { NotificationMedia } from 'src/entities/core/notificationmedia.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RecoverEvent,
} from 'typeorm';

@EventSubscriber()
export class NotificationMediaSubscriber
  implements EntitySubscriberInterface<NotificationMedia>
{
  utils: Utilities = new Utilities();
  constructor() {}
  listenTo() {
    return NotificationMedia;
  }

  beforeInsert(event: InsertEvent<NotificationMedia>) {
    const body = event.entity;
    body.url = this.utils.encryptData(body.url);
    event.entity = body;
  }

  beforeRecover(event: RecoverEvent<NotificationMedia>) {
    const body = event.entity;
    body.url = this.utils.decryptData(body.url);
    event.entity = body;
  }
  afterLoad(entity: NotificationMedia) {
    if (entity.url) {
      entity.url = this.utils.decryptData(entity.url);
    }
  }
}
