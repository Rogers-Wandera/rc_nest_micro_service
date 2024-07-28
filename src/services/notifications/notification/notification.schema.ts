import { ISendMailOptions } from '@nestjs-modules/mailer';
import {
  PushOptions,
  RTechSmsMessage,
  RTechSmsOption,
} from '@notifier/rtechnotifier/types/notify.types';
import Joi from 'joi';

const validateEmail = Joi.object<ISendMailOptions>();

const validateSms = Joi.object<RTechSmsOption>({
  provider: Joi.string().valid('twilio', 'pahappa').required().messages({
    'any.required': 'provider is required',
    'any.only': 'provider must be twilio or pahappa',
  }),
  message: Joi.object<RTechSmsMessage>({
    body: Joi.string().required().messages({
      'any.required': 'body is required',
    }),
    to: Joi.alternatives()
      .try(Joi.string(), Joi.array().items(Joi.string()))
      .required()
      .messages({
        'any.required': 'to is required',
        'alternatives.types': 'to must be a string or an array of strings',
      }),
    sender: Joi.string().optional(),
  })
    .required()
    .messages({
      'any.required': 'message is required',
    }),
});

const ValidatePush = Joi.object<PushOptions>({
  type: Joi.string()
    .valid('notopic', 'topic', 'multicast', 'system')
    .required()
    .messages({
      'any.required': 'type is required',
      'any.only': 'type must be notopic, topic, multicast, or system',
    }),
  payload: Joi.object(),
});

export const notificationSchema = Joi.object({
  type: Joi.string().required().valid('email', 'sms', 'push').messages({
    'any.required': 'type is required',
    'any.only': 'type must be email, sms, or push',
  }),
  payload: Joi.alternatives().conditional('type', {
    is: 'email',
    then: validateEmail,
    otherwise: Joi.alternatives().conditional('type', {
      is: 'sms',
      then: validateSms,
      otherwise: ValidatePush,
    }),
  }),
});
