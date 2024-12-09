import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { ReservationRemoteRepository } from './reservation.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { StatsdService } from 'src/statsd/statsd.service';
import { FareQuotesRemoteRepository } from 'src/fare-quotes/fare-quotes.remote-repository';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { ApisInfoRemoteRepository } from 'src/pnr/apisInfo.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { ReservationAgencyRemoteRepository } from './reservation-agency.remote-repository';
import { ReservationAgencyService } from './reservation-agency.service';
import { FareQuotesAgencyService } from 'src/fare-quotes/fare-quotes-agency.service';
import { ReservationAgencyController } from './reservation-agency.controller';
import { FareQuotesAgencyRemoteRepository } from 'src/fare-quotes/fare-quotes-agency.remote-repository';

@Module({
  controllers: [ReservationController, ReservationAgencyController],
  providers: [
    ReservationService,
    ReservationAgencyService,
    ReservationRemoteRepository,
    ReservationAgencyRemoteRepository,
    AuthService,
    FirebaseService,
    AuthRemoteRepository,
    PrismicRemoteRepository,
    StatsdService,
    FareQuotesService,
    FareQuotesAgencyService,
    FareQuotesRemoteRepository,
    FareQuotesAgencyRemoteRepository,
    ApisInfoRemoteRepository,
    JsonLogger,
  ],
  exports: [StatsdService],
})
export class ReservationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(ReservationController);
    consumer.apply(LoggingMiddleware).forRoutes(ReservationAgencyController);
  }
}
