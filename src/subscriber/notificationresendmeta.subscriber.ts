import { Utilities } from 'src/app/utils/app.utils';
import { NotificationMeta } from 'src/entities/core/notificationmeta.entity';
import { NotificationResendMeta } from 'src/entities/core/notificationresendmeta.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RecoverEvent,
} from 'typeorm';

@EventSubscriber()
export class NotificationResendMetaSubscriber
  implements EntitySubscriberInterface<NotificationResendMeta>
{
  utils: Utilities = new Utilities();
  constructor() {}
  listenTo() {
    return NotificationMeta;
  }

  beforeInsert(event: InsertEvent<NotificationResendMeta>) {
    const body = event.entity;
    body.name = this.utils.encryptData(body.name);
    body.value = this.utils.encryptData(String(body.value));
    event.entity = body;
  }

  beforeRecover(event: RecoverEvent<NotificationResendMeta>) {
    const body = event.entity;
    body.name = this.utils.decryptData(body.name);
    body.value = this.utils.decryptData(String(body.value));
    event.entity = body;
  }
  afterLoad(entity: NotificationResendMeta) {
    if (entity.name && entity.value) {
      entity.name = this.utils.decryptData(entity.name);
      entity.value = this.utils.decryptData(String(entity.value));
    }
  }
}
