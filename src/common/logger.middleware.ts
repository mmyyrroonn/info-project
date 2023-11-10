import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip, body } = req;
    const userAgent = req.get('user-agent') || '';

    res.on('finish', () => {
      const { statusCode, statusMessage } = res;
      const contentLength = res.get('content-length');

      this.logger.log(
        `${method} ${originalUrl} ${JSON.stringify(body)} ${statusCode} ${statusMessage} ${contentLength} - ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
