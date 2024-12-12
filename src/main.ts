import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CrudConfigService } from '@nestjsx/crud';
import { JsonLogger } from 'src/utils/json-logger';
import { AppModule } from './app.module';
import { CrudConfiguration } from './config/crud.config';
import * as Sentry from '@sentry/node';
import { HttpExceptionFilter } from './config/http-exception-filter';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import instana from'@instana/collector';


CrudConfigService.load(CrudConfiguration);

const xmlParser = require('express-xml-bodyparser');

async function bootstrap() {
  const logger = new JsonLogger('bootstrap');
  const xmlParserMidleware = xmlParser();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  instana
  app.set('trust proxy', 1);

  // Values in miliseconds
  const limiterPerSecond = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOWS_MS_PER_SECONDS),
    max: parseInt(process.env.RATE_LIMIT_WINDOWS_MAX_PER_SECONDS),
  });

  const limiterPerMinute = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOWS_MS_PER_MINUTES), //
    max: parseInt(process.env.RATE_LIMIT_WINDOWS_MAX_PER_MINUTES),
  });

  const limiterPerHour = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOWS_MS_PER_HOURS),
    max: parseInt(process.env.RATE_LIMIT_WINDOWS_MAX_PER_HOURS),
  });

  // Aplicar los l�mites a todas las rutas
  app.use(limiterPerSecond);
  app.use(limiterPerMinute);
  app.use(limiterPerHour);

  app.use(
    helmet({
      xXssProtection: false,
    })
  );
  

  app.useGlobalFilters(new HttpExceptionFilter());

  Sentry.init({
    environment: JSON.parse(process.env.SHOW_SWAGGER) ? 'development' : 'production',
    dsn: process.env.SENTRY_DNS,
  });

  app.use((req: Request, res: any, next: any) => {
    if (req.headers['authorization'] && String(req.headers['authorization']).includes('Bearer'))
      req.headers['authorization'] = req.headers['authorization'].replace('Bearer ', '');
    if (req.url.includes('/payments/webhook') && req.headers['content-type'].includes('xml')) {
      return xmlParserMidleware(req, res, next);
    }
    const span = instana.currentSpan();
    console.log(span)
    console.log(span.getTraceId)
    next();
  });

  const configService = app.get(ConfigService);
  const port = configService.get('server.port');

  if (JSON.parse(process.env.SHOW_SWAGGER)) {
    const configureSwagger = (app: INestApplication) => {
      const options = new DocumentBuilder()
        .addBearerAuth()
        .setTitle('Ibero Jet API')
        .setDescription('The Ibero Jet API documentation')
        .setVersion('1.0')
        .addTag('APIs')
        .build();

      const document = SwaggerModule.createDocument(app, options);
      SwaggerModule.setup('api', app, document, {
        explorer: true,
        swaggerOptions: { filter: true, showRequestDuration: true },
      });
    };
    configureSwagger(app);
  }

  await app.listen(port);
  logger.log(`Server running on port: ${port}`);
}
bootstrap();
