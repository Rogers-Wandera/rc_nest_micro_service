import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { RTechSendOptions } from '../types/notify.types';

@Injectable()
export class RTECHEmailService {
  public company: string;
  constructor(private readonly mailService: MailerService) {
    this.company = '';
  }

  async SendEmail(options: RTechSendOptions) {
    await this.mailService.verifyAllTransporters();
    const context = { ...options.context, company: this.company };
    const to = this.OrganizePriority(options);
    await this.mailService.sendMail({
      ...options,
      to,
      context,
      from: this.company,
    });
  }

  private OrganizePriority(options: RTechSendOptions) {
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
