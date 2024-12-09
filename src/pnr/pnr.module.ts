import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { FareQuotesModule } from 'src/fare-quotes/fare-quotes.module';
import { FareQuotesRemoteRepository } from 'src/fare-quotes/fare-quotes.remote-repository';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { ReservationService } from 'src/reservations/reservation.service';
import { StatsdService } from 'src/statsd/statsd.service';
import { ApisInfoRemoteRepository } from './apisInfo.remote-repository';
import { PaymentRemoteRepository } from './payment.remote-repository';
import { PnrController } from './pnr.controller';
import { PnrConverter } from './pnr.converter';
import { PnrRemoteRepository } from './pnr.remote-repository';
import { PnrService } from './pnr.service';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { CheckinRemoteRepository } from 'src/checkin/repositories';
import { SeatsRemoteRepository } from 'src/seats/seats.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { PnrAgencyService } from './pnr-agency.service';
import { PnrAgencyController } from './pnr-agency.controller';
import { PnrAgencyRemoteRepository } from './pnr-agency.remote-repository';
import { FareQuotesAgencyRemoteRepository } from 'src/fare-quotes/fare-quotes-agency.remote-repository';

@Module({
  controllers: [PnrController, PnrAgencyController],
  providers: [
    PnrService,
    PnrAgencyService,
    PnrConverter,
    AuthService,
    PnrRemoteRepository,
    PnrAgencyRemoteRepository,
    PnrConverter,
    FirebaseService,
    AuthRemoteRepository,
    ReservationService,
    ReservationRemoteRepository,
    PrismicRemoteRepository,
    StatsdService,
    FareQuotesService,
    FareQuotesRemoteRepository,
    FareQuotesAgencyRemoteRepository,
    PaymentRemoteRepository,
    ApisInfoRemoteRepository,
    SeatsRemoteRepository,
    CheckinRemoteRepository,
    JsonLogger,
    PrismicRemoteRepository,
  ],
  exports: [StatsdService],
  imports: [FareQuotesModule],
})
export class PnrModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(PnrController, PnrAgencyController);
  }
}
