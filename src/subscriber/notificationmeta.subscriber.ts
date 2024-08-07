import { Utilities } from 'src/app/utils/app.utils';
import { NotificationMeta } from 'src/entities/core/notificationmeta.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RecoverEvent,
} from 'typeorm';

@EventSubscriber()
export class NotificationMetaSubscriber
  implements EntitySubscriberInterface<NotificationMeta>
{
  utils: Utilities = new Utilities();
  constructor() {}
  listenTo() {
    return NotificationMeta;
  }

  beforeInsert(event: InsertEvent<NotificationMeta>) {
    const body = event.entity;
    body.name = this.utils.encryptData(body.name);
    body.value = this.utils.encryptData(String(body.value));
    event.entity = body;
  }

  beforeRecover(event: RecoverEvent<NotificationMeta>) {
    const body = event.entity;
    body.name = this.utils.decryptData(body.name);
    body.value = this.utils.decryptData(String(body.value));
    event.entity = body;
  }

  afterLoad(entity: NotificationMeta) {
    if (entity.name && entity.value) {
      entity.name = this.utils.decryptData(entity.name);
      entity.value = this.utils.decryptData(String(entity.value));
    }
  }
}
