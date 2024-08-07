import { Utilities } from 'src/app/utils/app.utils';
import { NotificationResendBody } from 'src/entities/core/notificationresendbody.entity';
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RecoverEvent,
  UpdateEvent,
} from 'typeorm';

@EventSubscriber()
export class NotificationBodyResendSubscriber
  implements EntitySubscriberInterface<NotificationResendBody>
{
  utils: Utilities = new Utilities();
  constructor() {}
  listenTo() {
    return NotificationResendBody;
  }

  beforeInsert(event: InsertEvent<NotificationResendBody>) {
    const body = event.entity;
    body.message = this.utils.encryptData(body.message);
    body.title = this.utils.encryptData(body.title);
    event.entity = body;
  }

  beforeUpdate(event: UpdateEvent<NotificationResendBody>) {
    const body = event.entity;
    body.message = this.utils.encryptData(body.message);
    body.title = this.utils.encryptData(body.title);
    event.entity = body;
  }

  beforeRecover(event: RecoverEvent<NotificationResendBody>) {
    const body = event.entity;
    body.message = this.utils.decryptData(body.message);
    body.title = this.utils.decryptData(body.title);
    event.entity = body;
  }

  afterLoad(entity: NotificationResendBody) {
    if (entity.message && entity.title) {
      entity.message = this.utils.decryptData(entity.message);
      entity.title = this.utils.decryptData(entity.title);
    }
  }
}
