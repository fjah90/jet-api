import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configValidation } from './config/config-validation';
import configuration from './config/env.config';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { typeOrmModuleAsyncOptions } from './config/typeOrmModuleAsyncOptions.config';
import { Config } from 'middlewares/common-middleware.config';
import { CommonMiddleware } from '../middlewares/common-middleware';
import { AuthModule } from './auth/auth.module';
import { AuthRemoteRepository } from './auth/auth.remote-repository';
import { AuthService } from './auth/auth.service';
import { CheckinModule } from './checkin/checkin.module';
import { CurrenciesModule } from './currencies/currencies.module';
import { FareQuotesModule } from './fare-quotes/fare-quotes.module';
import { FirebaseService } from './firebase/firebase.service';
import { FlightsModule } from './flights/flights.module';
import { HealthModule } from './health/health.module';
import { PaymentsModule } from './payments/payments.module';
import { PingModule } from './ping/ping.module';
import { PnrModule } from './pnr/pnr.module';
import { PrismicModule } from './prismic/prismic.module';
import { ReservationModule } from './reservations/reservation.module';
import { SeatsModule } from './seats/seats.module';
import { SessionRegistryModule } from './session-registry/session-registry.module';
import { SessionRegistryService } from './session-registry/session-registry.service';
import { StatsdService } from './statsd/statsd.service';
import { VersionModule } from './version/version.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { AgencyModule } from './agency/agency.module';
import { AgencyRemoteRepository } from './agency/agency.remote-repository';
import { AgencyService } from './agency/agency.service';

@Module({
  imports: [
    // TypeOrmModule.forRootAsync(typeOrmModuleAsyncOptions),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: configValidation,
      validationOptions: {
        abortEarly: true,
      },
    }),
    RedisModule.forRoot({
      config: {
        name: configuration().sentinel.name,
        host: configuration().cache.host,
        port: configuration().cache.port,
        password: configuration().cache.auth_pass,
        // sentinels: [{ host: configuration().sentinel.host, port: configuration().sentinel.port }],
      },
    }),
    SessionRegistryModule,
    AuthModule,
    VersionModule,
    FlightsModule,
    FareQuotesModule,
    CheckinModule,
    CurrenciesModule,
    PrismicModule,
    SeatsModule,
    ReservationModule,
    CheckinModule,
    PnrModule,
    HealthModule,
    PingModule,
    PaymentsModule,
    AgencyModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    FirebaseService,
    AuthService,
    CommonMiddleware,
    AuthRemoteRepository,
    StatsdService,
    SessionRegistryService,
    AgencyService,
    AgencyRemoteRepository,
    {
      provide: CommonMiddleware,
      useFactory: (configService: ConfigService<Config>, sessionRegistryService: SessionRegistryService) => {
        return new CommonMiddleware(configService, sessionRegistryService);
      },
      inject: [ConfigService, SessionRegistryService],
    },
  ],
  exports: [StatsdService],
})
export class AppModule implements NestModule {
  async configure(consumer: MiddlewareConsumer) {
    await consumer
      .apply(CommonMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.ALL },
        { path: 'auth/signin', method: RequestMethod.ALL },
        { path: 'auth/signup', method: RequestMethod.ALL },
        { path: 'auth/regenerate', method: RequestMethod.ALL },
        { path: 'ping', method: RequestMethod.GET },
        { path: '/', method: RequestMethod.ALL },
        { path: 'payments/webhook', method: RequestMethod.ALL },
        { path: 'payments/status', method: RequestMethod.ALL },
        { path: 'version', method: RequestMethod.ALL },
        { path: 'auth-agency/login', method: RequestMethod.ALL },
        { path: 'auth-agency/signin', method: RequestMethod.ALL },
        { path: 'auth-agency/validatesecuritytoken', method: RequestMethod.ALL },
        { path: 'auth-agency/forgotpassword', method: RequestMethod.ALL },
        { path: 'agency/changepassword', method: RequestMethod.ALL },
        { path: 'agency/viewcredit', method: RequestMethod.ALL },
        { path: 'agency/modifyagent', method: RequestMethod.ALL },
        { path: 'agency/changestatus', method: RequestMethod.ALL },
        { path: 'agency/getagents', method: RequestMethod.ALL },
        { path: 'agency/getagent', method: RequestMethod.ALL },
        { path: 'reservation-agency/list', method: RequestMethod.ALL },
        { path: 'reservation-agency/detail', method: RequestMethod.ALL },
        { path: 'reservation-agency/detail/extras', method: RequestMethod.ALL },
        { path: 'reservation-agency/extras', method: RequestMethod.ALL },
        { path: 'reservation-agency/seats', method: RequestMethod.ALL },
        { path: 'fare-quote/public', method: RequestMethod.ALL },
        { path: 'fare-quote-agency', method: RequestMethod.ALL },
        { path: 'fare-quote-agency/details', method: RequestMethod.ALL },
        { path: 'flightsagency', method: RequestMethod.ALL },
        { path: 'pnr-agency/summary', method: RequestMethod.ALL },
        { path: 'pnr-agency/create', method: RequestMethod.ALL },
        { path: 'pnr-agency/passengers', method: RequestMethod.ALL },
        { path: 'pnr-agency', method: RequestMethod.ALL },
        { path: 'payments-agency/generate-checkout', method: RequestMethod.ALL },
        { path: 'payments-agency/paywithcreditagency', method: RequestMethod.ALL },
        { path: 'payments-agency/save-payment', method: RequestMethod.ALL },
        { path: 'seats-agency/list', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
