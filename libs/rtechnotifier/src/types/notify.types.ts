import { ISendMailOptions } from '@nestjs-modules/mailer';
import {
  Message,
  MessagingPayload,
  MulticastMessage,
} from 'firebase-admin/lib/messaging/messaging-api';
import { NOTIFICATION_PATTERN } from 'src/app/patterns/notification.patterns';
import { MediaTypes, PRIORITY_TYPES } from 'src/app/types/app.types';
import { NotificationTypes } from './enums';

export type mediaTypes = {
  type: MediaTypes;
  imageUrl: string;
};

export type SystemNotificationData = {
  title: string;
  message: string;
  timestamp: Date;
  mediaUrl?: mediaTypes[];
  meta?: Record<string, string | number | Date | Boolean>;
};

export type NotificationTags = { name: string; link?: string };
export type NotificationRecipient =
  | { type: 'broadcast' }
  | { type: 'no broadcast'; recipients: string[] };

export type RTechSystemNotificationType = {
  pattern: NOTIFICATION_PATTERN;
  priority: PRIORITY_TYPES;
  type: NotificationTypes;
  data: SystemNotificationData;
  recipient: NotificationRecipient;
  tags?: NotificationTags[];
  link?: string;
  resendId?: string;
};

type payLoadWithNoTopic = {
  type: 'topic';
  payload: MessagingPayload;
};

type payLoadWithTopic = {
  type: 'notopic';
  payload: Message;
};
type payLoadMultiCast = {
  type: 'multicast';
  payload: MulticastMessage;
};

type payLoadSystem = {
  type: 'system';
  payload: RTechSystemNotificationType;
};

type PushOptionsBase =
  | payLoadWithNoTopic
  | payLoadWithTopic
  | payLoadMultiCast
  | payLoadSystem;

// type PushOptionsWithTopic = PushOptionsBase & {
//   type: 'topic';
//   topic: string;
// };

// type PushOptionsWithoutTopic = PushOptionsBase & {
//   type: 'notopic' | 'multicast' | 'system';
// };

// export type PushOptions = PushOptionsWithTopic | PushOptionsWithoutTopic;

export type PushOptions = PushOptionsBase;

export type RTechSmsMessage = {
  body: string;
  to: string | string[];
  sender?: string;
};
export type RTechSmsTypes = 'twilio' | 'pahappa';

export type RTechSmsOption = {
  provider: RTechSmsTypes;
  message: RTechSmsMessage;
};

type EmailOptions = {
  type: 'email';
  payload: ISendMailOptions;
};

type SMSOptions = {
  type: 'sms';
  payload: RTechSmsOption;
};

type PushTypes = {
  type: 'push';
  payload: PushOptions;
};

export type NotificationOptions = EmailOptions | SMSOptions | PushTypes;
