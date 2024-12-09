import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { StatsdService } from 'src/statsd/statsd.service';
import { FareQuotesController } from './fare-quotes.controller';
import { FareQuotesRemoteRepository } from './fare-quotes.remote-repository';
import { FareQuotesService } from './fare-quotes.service';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { JsonLogger } from 'src/utils/json-logger';
import { FareQuotesAgencyService } from './fare-quotes-agency.service';
import { FareQuotesAgencyController } from './fare-quotes-agency.controller';
import { FareQuotesAgencyRemoteRepository } from './fare-quotes-agency.remote-repository';
import { UserAgentMiddleware } from 'src/auth/dto/user-agent-middleware';


@Module({
  controllers: [FareQuotesController, FareQuotesAgencyController],
  providers: [
    FareQuotesService,
    FareQuotesAgencyService,
    FareQuotesRemoteRepository,
    FareQuotesAgencyRemoteRepository,
    FirebaseService,
    AuthService,
    AuthRemoteRepository,
    StatsdService,
    JsonLogger,
  ],
  exports: [StatsdService, FareQuotesRemoteRepository],
})
export class FareQuotesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAgentMiddleware).forRoutes(FareQuotesController, FareQuotesAgencyController);
    consumer.apply(LoggingMiddleware).forRoutes(FareQuotesController, FareQuotesAgencyController);
  }
}
