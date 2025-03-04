import { BadRequestException, Injectable } from '@nestjs/common';
import { RTechSmsMessage, RTechSmsTypes } from '../types/notify.types';
import { TwilioSMSService } from './twiliosms.setup';
import { PahappaSMSService } from './pahappasms.setup';
import { PRIORITY_TYPES } from 'src/app/types/app.types';

@Injectable()
export class RTechSmsService {
  public type: RTechSmsTypes;
  constructor(
    private readonly twilioservice: TwilioSMSService,
    private readonly pahappaservice: PahappaSMSService,
  ) {
    this.type = 'twilio';
  }
  private validatePhoneNumber(
    phoneNumber: { to: string; priority: PRIORITY_TYPES }[],
  ) {
    const regex = /^\+?[1-9]\d{1,14}$/;
    let validates: boolean | boolean[] = false;
    if (Array.isArray(phoneNumber) && phoneNumber.length > 1) {
      validates = phoneNumber.map((number) => regex.test(number.to));
    } else {
      validates = regex.test(phoneNumber[0].to);
    }
    if (Array.isArray(validates)) {
      if (validates.includes(false)) {
        throw new Error('Please provide valid phone numbers e.g +256------');
      }
    } else {
      if (!validates) {
        throw new Error('Please provide a valid phone number e.g +256------');
      }
    }
    return validates;
  }
  async sendMessage(message: RTechSmsMessage) {
    if (!message) {
      throw new BadRequestException('Please provide message');
    }
    const validate = this.validatePhoneNumber(message.to);
    if (!validate)
      throw new BadRequestException(
        'Please provide a valid phone number e.g +256------',
      );
    switch (this.type) {
      case 'twilio':
        return await this.twilioservice.sendMessage(message);
      case 'pahappa':
        return await this.pahappaservice.sendMessage(message);
      default:
        throw new BadRequestException(
          'The sms service is not supported at the moment',
        );
    }
  }
}
