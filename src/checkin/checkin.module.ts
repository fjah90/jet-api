import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { ReservationService } from 'src/reservations/reservation.service';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { PrismicService } from 'src/prismic/services';
import { CheckinController } from './controllers';
import { CheckinService } from './services';
import { StatsdService } from 'src/statsd/statsd.service';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { FareQuotesRemoteRepository } from 'src/fare-quotes/fare-quotes.remote-repository';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { CheckinRemoteRepository } from './repositories';
import { ApisInfoRemoteRepository } from 'src/pnr/apisInfo.remote-repository';
import { PnrRemoteRepository } from 'src/pnr/pnr.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { CheckinAgencyController } from './controllers/checkin-agency.controller';
import { ReservationAgencyService } from 'src/reservations/reservation-agency.service';
import { CheckinAgencyService } from './services/checkin-agency.service';
import { ReservationAgencyRemoteRepository } from 'src/reservations/reservation-agency.remote-repository';
import { FareQuotesAgencyService } from 'src/fare-quotes/fare-quotes-agency.service';
import { FareQuotesAgencyRemoteRepository } from 'src/fare-quotes/fare-quotes-agency.remote-repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [CheckinController, CheckinAgencyController],
  providers: [
    CheckinService,
    CheckinAgencyService,
    AuthService,
    FirebaseService,
    AuthRemoteRepository,
    ReservationService,
    ReservationAgencyService,
    ReservationRemoteRepository,
    ReservationAgencyRemoteRepository,
    PrismicRemoteRepository,
    PrismicService,
    StatsdService,
    FareQuotesService,
    FareQuotesAgencyService,
    FareQuotesAgencyRemoteRepository,
    FareQuotesRemoteRepository,
    CheckinRemoteRepository,
    ApisInfoRemoteRepository,
    PnrRemoteRepository,
    JsonLogger,
  ],
  exports: [CheckinService, CheckinAgencyService, StatsdService],
})
export class CheckinModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(CheckinController, CheckinAgencyController);
  }
}
