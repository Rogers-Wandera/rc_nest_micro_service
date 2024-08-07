import { format, isBefore, parse } from 'date-fns';
import CryptoJs from 'crypto-js';
import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class Utilities {
  constructor() {}
  public encryptData(input: string): string {
    try {
      const secretKey = process.env.ENCRYPTION_KEY;
      const cipherInput = CryptoJs.AES.encrypt(input, secretKey).toString();
      return cipherInput;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public decryptData(encrypted: string): string {
    try {
      const secretKey = process.env.ENCRYPTION_KEY;
      const bytes = CryptoJs.AES.decrypt(encrypted, secretKey);
      const ciphedInput = bytes.toString(CryptoJs.enc.Utf8);
      return ciphedInput;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public checkExpireDate(date: string | Date): boolean {
    try {
      const newdate = new Date(date);
      const fm = format(newdate, 'yyyy-MM-dd HH:mm:ss');
      const parsedDate = parse(fm, 'yyyy-MM-dd HH:mm:ss', new Date());
      const currentDate = new Date();
      return isBefore(parsedDate, currentDate);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public encryptUrl(input: string) {
    return encodeURIComponent(this.encryptData(input));
  }
  public decryptUrl(decrypted: string) {
    return decodeURIComponent(this.decryptData(decrypted));
  }

  formatCamelCase(input: string): string {
    // Find positions where camel case changes
    const matches = input.match(/([A-Z]?[^A-Z]*)/g);
    if (!matches) {
      return input;
    }

    // Join matches with space and capitalize first letter if necessary
    const formatted = matches
      .map((match, index) => {
        if (index === 0) {
          // Capitalize first letter if it's lowercase
          return match.charAt(0).toUpperCase() + match.slice(1);
        } else {
          return match.toLowerCase();
        }
      })
      .join(' ');

    return formatted.trim();
  }

  Hash(data: string): string {
    return CryptoJs.SHA256(data).toString();
  }
}
