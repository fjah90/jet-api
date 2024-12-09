import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PnrRemoteRepository } from 'src/pnr/pnr.remote-repository';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { ReservationService } from 'src/reservations/reservation.service';
import { StatsdService } from 'src/statsd/statsd.service';
import { SeatsController } from './seats.controller';
import { SeatsService } from './seats.service';
import { FareQuotesRemoteRepository } from 'src/fare-quotes/fare-quotes.remote-repository';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { SeatsRemoteRepository } from './seats.remote-repository';
import { ApisInfoRemoteRepository } from 'src/pnr/apisInfo.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { SeatsAgencyController } from './seats-agency.controller';
import { ReservationAgencyRemoteRepository } from 'src/reservations/reservation-agency.remote-repository';
import { SeatsAgencyService } from './seats-agency.service';
import { FareQuotesAgencyService } from 'src/fare-quotes/fare-quotes-agency.service';
import { FareQuotesAgencyRemoteRepository } from 'src/fare-quotes/fare-quotes-agency.remote-repository';

@Module({
  controllers: [SeatsController, SeatsAgencyController],
  providers: [
    SeatsService,
    SeatsAgencyService,
    AuthService,
    FirebaseService,
    AuthRemoteRepository,
    ReservationService,
    ReservationRemoteRepository,
    ReservationAgencyRemoteRepository,
    PnrRemoteRepository,
    PrismicRemoteRepository,
    StatsdService,
    FareQuotesService,
    FareQuotesAgencyService,
    FareQuotesRemoteRepository,
    FareQuotesAgencyRemoteRepository,
    SeatsRemoteRepository,
    ApisInfoRemoteRepository,
    JsonLogger,
  ],
  exports: [StatsdService],
})
export class SeatsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(SeatsController);
    consumer.apply(LoggingMiddleware).forRoutes(SeatsAgencyController);
  }
}
