import { Utilities } from 'src/app/utils/app.utils';
import { NotificationBody } from 'src/entities/core/notificationbody.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RecoverEvent,
} from 'typeorm';

@EventSubscriber()
export class NotificationBodySubscriber
  implements EntitySubscriberInterface<NotificationBody>
{
  utils: Utilities = new Utilities();
  constructor() {}
  listenTo() {
    return NotificationBody;
  }

  beforeInsert(event: InsertEvent<NotificationBody>) {
    const body = event.entity;
    body.message = this.utils.encryptData(body.message);
    body.title = this.utils.encryptData(body.title);
    event.entity = body;
  }

  beforeRecover(event: RecoverEvent<NotificationBody>) {
    const body = event.entity;
    body.message = this.utils.decryptData(body.message);
    body.title = this.utils.decryptData(body.title);
    event.entity = body;
  }

  afterLoad(entity: NotificationBody) {
    if (entity.message && entity.title) {
      entity.message = this.utils.decryptData(entity.message);
      entity.title = this.utils.decryptData(entity.title);
    }
  }
}
