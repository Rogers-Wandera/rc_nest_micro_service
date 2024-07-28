import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import client, { Twilio } from 'twilio';
import { RTechSmsMessage } from '../types/notify.types';
import { EnvConfig, twilioconfig } from 'src/app/configs/envconfigs';

@Injectable()
export class TwilioSMSService {
  private twilio: Twilio;
  constructor(private readonly configService: ConfigService<EnvConfig>) {
    this.twilio = client(
      configService.get<twilioconfig>('twilio').accountSid,
      configService.get<twilioconfig>('twilio').authToken,
    );
  }
  async sendMessage(message: RTechSmsMessage) {
    if (Array.isArray(message.to)) {
      return this.SendToMultiple(message);
    } else {
      return this.SendToSingle(message);
    }
  }

  private async SendToSingle(message: RTechSmsMessage) {
    return this.twilio.messages.create({
      from: this.configService.get<twilioconfig>('twilio').number,
      to: message.to as string,
      body: message.body,
    });
  }
  private async SendToMultiple(message: RTechSmsMessage) {
    if (Array.isArray(message.to)) {
      const promises = message.to.map(async (phoneNumber) => {
        return this.twilio.messages.create({
          body: message.body,
          from: this.configService.get<twilioconfig>('twilio').number,
          to: phoneNumber,
        });
      });
      const results = await Promise.all(promises);
      return results;
    }
  }
}
