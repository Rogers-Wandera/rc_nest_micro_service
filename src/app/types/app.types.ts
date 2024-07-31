export type Paramstype = 'body' | 'params' | 'query';

export enum NOTIFICATION_TYPE {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
  PUSH_SYSTEM = 'push_system',
}

export enum NOTIFICATION_STATUS {
  SENT = 'sent',
  RECIEVED = 'recieved',
  READ = 'read',
  FAILED = 'failed',
}

export enum NOTIFICATION_RESEND_STATUS {
  RESCHEDULED = 'rescheduled',
  SENT = 'sent',
  PENDING = 'pending',
  CLOSED = 'closed',
  FAILED = 'failed',
}
export enum PRIORITY_TYPES {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum NotificationDeliveryTypes {
  SMS_DELIVERY = 'sms_delivery',
  EMAIL_DELIVERY = 'email_delivery',
  PUSH_DELIVERY = 'push_delivery',
}

export enum MediaTypes {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}
