import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RTechSmsMessage } from '../types/notify.types';
import axios from 'axios';
import { EnvConfig, pahappaconfig } from 'src/app/configs/envconfigs';

type response = 'OK';

@Injectable()
export class PahappaSMSService {
  private readonly url: string;
  constructor(private readonly configService: ConfigService<EnvConfig>) {
    this.url = `https://www.egosms.co/api/v1/plain/`;
  }
  async sendMessage(message: RTechSmsMessage) {
    if (Array.isArray(message.to)) {
      const [failed, success] = await this.SendToMultiple(message);
      if (failed.length <= 0) {
        return 'Sms sent successfully';
      }
      return success.join(', '), failed.join(', ');
    }
    const response = await this.SendToSingle(message, message.to);
    if (response.startsWith(`Not Sent`)) {
      throw new BadRequestException(response);
    }
    return 'Sms sent successfully';
  }

  private async SendToSingle(message: RTechSmsMessage, number: string) {
    const response = await axios.get<response>(this.url, {
      params: {
        username: this.configService.get<pahappaconfig>('pahappa').username,
        password: this.configService.get<pahappaconfig>('pahappa').password,
        number: number,
        message: message.body,
        sender: message.sender || 'RTECH',
      },
    });
    if (response.data !== 'OK') {
      return `Not Sent ${response.data}`;
    }
    return response.data;
  }
  private async SendToMultiple(message: RTechSmsMessage) {
    if (Array.isArray(message.to)) {
      const promises = message.to.map(async (phoneNumber) => {
        const response = await this.SendToSingle(message, phoneNumber);
        if (response.startsWith(`Not Sent`)) {
          return `Failed to send to number [${phoneNumber}] with reason ${response}`;
        }
        return `Sms sent to [${phoneNumber}] successfully`;
      });
      const results = await Promise.all(promises);
      const filters = results.filter((res) => res.startsWith(`Failed`));
      return [filters, results];
    }
  }
}
