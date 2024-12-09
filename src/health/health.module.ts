import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthController } from './controllers';
import { HealthService } from './services';
import { PrismicService } from 'src/prismic/services';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { AuthService } from 'src/auth/auth.service';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { FirebaseService } from 'src/firebase/firebase.service';
import { StatsdService } from 'src/statsd/statsd.service';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { FareQuotesRemoteRepository } from 'src/fare-quotes/fare-quotes.remote-repository';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { ReservationService } from 'src/reservations/reservation.service';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { ApisInfoRemoteRepository } from 'src/pnr/apisInfo.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { EncryptionService } from 'src/payments/encryption.service';
import { EpgPaymentRemoteRepository } from 'src/payments/repositories/epg-payment.remote-repository';
@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    PrismicService,
    PrismicRemoteRepository,
    AuthService,
    FirebaseService,
    AuthRemoteRepository,
    StatsdService,
    FareQuotesService,
    FareQuotesRemoteRepository,
    ReservationService,
    ReservationRemoteRepository,
    ApisInfoRemoteRepository,
    JsonLogger,
    EncryptionService,
    EpgPaymentRemoteRepository,
  ],
  exports: [HealthService, StatsdService],
})
export class HealthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(HealthController);
  }
}
