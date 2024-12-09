import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { StatsdService } from 'src/statsd/statsd.service';
import { JsonLogger } from 'src/utils/json-logger';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new JsonLogger('LoggingMiddleware');
  private statsdService: StatsdService; // Declare statsdService property

  constructor(statsdService: StatsdService) {
    this.statsdService = statsdService; // Store statsdService as a property
  }

  use(req: Request, res: Response, next: () => void) {
    const start = Date.now();
    const logger = this.logger;
    const statsdServiceClient = this.statsdService;
    const originalSend = res.send;
    res.send = function (this: Response<any>, body?: any): Response<any> {
      originalSend.call(this, body);

      const end = Date.now();
      const responseTime = end - start;
      const rateLimitHeaders = this.getHeaders();
      logger.log(`[${req.method}] ${req.originalUrl} [${this.statusCode}] ${responseTime}ms`);
      logger.log(`user:${req.user} Response: ${JSON.stringify(body)}`);
      logger.log(`user:${req.user} Response x-ratelimit-limit ${rateLimitHeaders['x-ratelimit-limit']}`);
      logger.log(`user:${req.user} Response x-ratelimit-remaining ${rateLimitHeaders['x-ratelimit-remaining']}`);
      logger.log(`user:${req.user} Response x-ratelimit-reset ${rateLimitHeaders['x-ratelimit-reset']}`);

      if (this.statusCode.toString().startsWith('4')) statsdServiceClient.timing('_4xx_error', 4000);
      if (this.statusCode.toString().startsWith('5')) statsdServiceClient.timing('_5xx_error', 4000);
      return this;
    };
    next();
  }
}
