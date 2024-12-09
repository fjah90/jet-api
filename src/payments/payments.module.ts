import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { PnrRemoteRepository } from 'src/pnr/pnr.remote-repository';
import { StatsdService } from 'src/statsd/statsd.service';
import { EncryptionService } from './encryption.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EpgPaymentRemoteRepository } from './repositories/epg-payment.remote-repository';
import { PaymentRemoteRepository } from './repositories/payment.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { ApisInfoRemoteRepository } from 'src/pnr/apisInfo.remote-repository';
import { NotificationRemoteRepository } from './repositories/notification.remote-repository';
import { PaymentsAgencyController } from './payments-agency.controller';
import { ReservationAgencyRemoteRepository } from 'src/reservations/reservation-agency.remote-repository';
import { PaymentsAgencyService } from './payments-agency.service';
import { PnrAgencyRemoteRepository } from 'src/pnr/pnr-agency.remote-repository';
import { UserAgentMiddleware } from 'src/auth/dto/user-agent-middleware';

@Module({
  controllers: [PaymentsController, PaymentsAgencyController],
  providers: [
    PaymentsService,
    PaymentsAgencyService,
    EncryptionService,
    AuthService,
    FirebaseService,
    AuthRemoteRepository,
    EpgPaymentRemoteRepository,
    PaymentRemoteRepository,
    StatsdService,
    PnrRemoteRepository,
    PnrAgencyRemoteRepository,
    JsonLogger,
    ReservationRemoteRepository,
    ReservationAgencyRemoteRepository,
    ApisInfoRemoteRepository,
    NotificationRemoteRepository,
  ],
  exports: [StatsdService],
})
export class PaymentsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAgentMiddleware).forRoutes(PaymentsController, PaymentsAgencyController);
    consumer.apply(LoggingMiddleware).forRoutes(PaymentsController);
    consumer.apply(LoggingMiddleware).forRoutes(PaymentsAgencyController);
  }
}
