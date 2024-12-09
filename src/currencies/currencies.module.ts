import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CurrenciesController } from './currencies.controller';
import { AuthService } from 'src/auth/auth.service';
import { CurrenciesRemoteRepository } from './currencies.remote-repository';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { StatsdService } from 'src/statsd/statsd.service';
import { LoggingMiddleware } from 'middlewares/logging-middleware';

@Module({
  controllers: [CurrenciesController],
  providers: [
    CurrenciesService,
    AuthService,
    CurrenciesRemoteRepository,
    FirebaseService,
    AuthRemoteRepository,
    StatsdService,
  ],
  exports: [StatsdService],
})
export class CurrenciesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes(CurrenciesController);
  }
}
