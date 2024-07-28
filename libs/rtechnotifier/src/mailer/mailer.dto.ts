import { ISendMailOptions } from '@nestjs-modules/mailer';
import { IsEmail, IsEmpty, IsNotEmpty, IsString } from 'class-validator';

export class EmailOptionsDTO implements ISendMailOptions {
  @IsEmpty()
  @IsString()
  from: string;

  @IsNotEmpty()
  @IsEmail()
  to: string;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsEmpty()
  @IsString()
  text: string;

  @IsEmpty()
  @IsString()
  html: string;

  @IsNotEmpty()
  @IsString()
  template: string;
}
