import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { VersionController } from './controllers/version.controller';
import { VersionService } from './services';
import { StatsdService } from 'src/statsd/statsd.service';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
@Module({
  controllers: [VersionController],
  providers: [VersionService, StatsdService],
  exports: [VersionService, StatsdService],
})
export class VersionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(VersionController);
  }
}
