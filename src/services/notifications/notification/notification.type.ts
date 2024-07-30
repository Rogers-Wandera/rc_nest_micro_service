import { NotificationTypes } from '@notifier/rtechnotifier/types/enums';
import {
  mediaTypes,
  RecipientType,
} from '@notifier/rtechnotifier/types/notify.types';
import { NOTIFICATION_PATTERN } from 'src/app/patterns/notification.patterns';
import { NOTIFICATION_TYPE, PRIORITY_TYPES } from 'src/app/types/app.types';

export type NotificationData = {
  data: {
    message: string;
    title: string;
    timestamp: Date;
    mediaUrl?: mediaTypes[];
    meta?: Record<string, string | number | Date | Boolean>;
  };
  pattern: NOTIFICATION_PATTERN;
  priority: PRIORITY_TYPES;
  type: NOTIFICATION_TYPE;
  notificationType: NotificationTypes;
  command: NOTIFICATION_PATTERN;
  recipient: RecipientType[];
  createdBy: string;
  link?: string;
};
