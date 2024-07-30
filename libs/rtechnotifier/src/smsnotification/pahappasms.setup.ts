import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RTechSmsMessage } from '../types/notify.types';
import axios from 'axios';
import { EnvConfig, pahappaconfig } from 'src/app/configs/envconfigs';
import { PRIORITY_TYPES } from 'src/app/types/app.types';

type response = 'OK';

@Injectable()
export class PahappaSMSService {
  private readonly url: string;
  private readonly logger = new Logger();
  constructor(private readonly configService: ConfigService<EnvConfig>) {
    this.url = `https://www.egosms.co/api/v1/plain/`;
  }
  async sendMessage(message: RTechSmsMessage) {
    if (Array.isArray(message.to) && message.to.length > 1) {
      const [failed, success] = await this.SendToMultiple(message);
      if (failed.length <= 0) {
        return 'Sms sent successfully';
      }
      return success.join(', '), failed.join(', ');
    }
    const response = await this.SendToSingle(message, message.to[0].to);
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
        message: `${message.body} \n Priority: ${message.priority || PRIORITY_TYPES.HIGH}`,
        sender: message.sender || 'RTECH',
      },
    });
    if (response.data !== 'OK') {
      this.logger.error(`Message Not sent: Reason: `, response.data);
      return `Not Sent ${response.data}`;
    }

    return response.data;
  }
  private async SendToMultiple(message: RTechSmsMessage) {
    if (Array.isArray(message.to)) {
      const recipients = this.OrganizePriority(message);
      const promises = recipients.map(async (phoneNumber) => {
        const response = await this.SendToSingle(message, phoneNumber);
        if (response.startsWith(`Not Sent`)) {
          this.logger.error(`Message Not sent: Reason: `, response);
          return `Failed to send to number [${phoneNumber}] with reason ${response}`;
        }
        return `Sms sent to [${phoneNumber}] successfully`;
      });
      const results = await Promise.all(promises);
      const filters = results.filter((res) => res.startsWith(`Failed`));
      return [filters, results];
    }
  }
  private OrganizePriority(options: RTechSmsMessage) {
    const PRIORITY_ORDER = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };
    const to = options.to
      .sort((a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority])
      .map((item) => item.to);
    return to;
  }
}
