import {
  Injectable,
  NestMiddleware,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { Request, Response, NextFunction } from 'express';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import fspromises from 'fs/promises';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');
  constructor() {
    this.use = this.use.bind(this);
  }
  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const logMessage = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;
      if (statusCode >= 400) {
        this.logger.error(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });
    next();
  }
}

export const logEvent = async (message: string, logFile: string) => {
  const date = `${format(new Date(), 'yyMMdd\tHH:mm:ss')}`;
  const logTime = `${date}\t${uuid()}\t${message}\n`;

  try {
    if (!existsSync(path.join(__dirname, '..', '..', 'logs'))) {
      await fspromises.mkdir(path.join(__dirname, '..', '..', 'logs'));
    }
    await fspromises.appendFile(
      path.join(__dirname, '..', '..', 'logs', logFile),
      logTime,
    );
  } catch (error) {
    throw new BadRequestException(error);
  }
};

@Injectable()
export class ServerLogger implements NestMiddleware {
  constructor() {
    this.use = this.use.bind(this);
  }
  use(req: Request, res: Response, next: NextFunction): void {
    const {
      method,
      headers: { origin },
    } = req;
    const start = Date.now();
    res.on('finish', async () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const logMessage = `${method}\t${origin}\t${req.url}\t${statusCode} - ${duration}ms`;
      await logEvent(logMessage, 'reqLog.md');
    });
    next();
  }
}
