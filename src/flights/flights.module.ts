import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { FlightsService } from './flights.service';
import { FlightsController } from './flights.controller';
import { AuthService } from '../auth/auth.service';
import { FlightsRemoteRepository } from './flights.remote-repository';
import { AuthModule } from 'src/auth/auth.module';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { PrismicService } from 'src/prismic/services';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { StatsdService } from 'src/statsd/statsd.service';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { FareQuotesRemoteRepository } from 'src/fare-quotes/fare-quotes.remote-repository';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { ReservationService } from 'src/reservations/reservation.service';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { ApisInfoRemoteRepository } from 'src/pnr/apisInfo.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { FlightsAgencyService } from './flights-agency.service';
import { FlightsAgencyController } from './flights-agency.controller';

@Module({
  controllers: [FlightsController, FlightsAgencyController],
  providers: [
    FlightsService,
    FlightsAgencyService,
    AuthService,
    AuthModule,
    FlightsRemoteRepository,
    FirebaseService,
    AuthRemoteRepository,
    PrismicService,
    PrismicRemoteRepository,
    StatsdService,
    FareQuotesService,
    FareQuotesRemoteRepository,
    ReservationService,
    ReservationRemoteRepository,
    ApisInfoRemoteRepository,
    JsonLogger,
  ],
  exports: [StatsdService],
})
export class FlightsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(FlightsController, FlightsAgencyController);
  }
}
