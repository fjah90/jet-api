import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionRegistryModule } from 'src/session-registry/session-registry.module';
import { AgencyService } from './agency.service';
import { StatsdService } from 'src/statsd/statsd.service';
import { AgencyRemoteRepository } from './agency.remote-repository';
import { AgencyController } from './agency.controller';
import { LoggingMiddleware } from 'middlewares/logging-middleware';

@Module({
  imports: [ConfigModule, SessionRegistryModule],
  providers: [AgencyService, AgencyRemoteRepository, StatsdService],
  controllers: [AgencyController],
  exports: [StatsdService],
})
export class AgencyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(AgencyController);
  }
}
