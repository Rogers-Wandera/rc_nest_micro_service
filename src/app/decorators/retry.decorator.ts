import { SetMetadata } from '@nestjs/common';
export const RETRY_KEY = 'retry_send';

export const Retry = (retries = 2) => SetMetadata(RETRY_KEY, retries);
