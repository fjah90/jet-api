import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismicController } from './controllers';
import { PrismicRemoteRepository } from './repositories';
import { PrismicService } from './services';
import { StatsdService } from 'src/statsd/statsd.service';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { FareQuotesRemoteRepository } from 'src/fare-quotes/fare-quotes.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { ReservationService } from 'src/reservations/reservation.service';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { ApisInfoRemoteRepository } from 'src/pnr/apisInfo.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [PrismicController],
  providers: [
    AuthService,
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
  exports: [PrismicService, StatsdService],
})
export class PrismicModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(PrismicController);
  }
}
