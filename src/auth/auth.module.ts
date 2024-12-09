import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule } from '@nestjs/config';
import { FirebaseService } from '../firebase/firebase.service';
import { AuthRemoteRepository } from './auth.remote-repository';
import { StatsdService } from 'src/statsd/statsd.service';
import { SessionRegistryService } from 'src/session-registry/session-registry.service';
import { SessionRegistryModule } from 'src/session-registry/session-registry.module';
import { LoggingMiddleware } from 'middlewares/logging-middleware';
import { Auth_AgencyController } from './auth-agency.controller';
import { Auth_AgencyService } from './auth-agency.service';
import { Auth_AgencyRemoteRepository } from './auth-agency.remote-repository';
import { UserAgentMiddleware } from './dto/user-agent-middleware';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UserAgentInterceptor } from './interceptors/user-agent.interceptor';


@Module({
  imports: [ConfigModule, SessionRegistryModule],
  providers: [
    FirebaseService,
    AuthService,
    AuthRemoteRepository,
    Auth_AgencyService,
    Auth_AgencyRemoteRepository,
    StatsdService,
    SessionRegistryService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserAgentInterceptor,
    },
  ],
  controllers: [AuthController, Auth_AgencyController],
  exports: [StatsdService],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserAgentMiddleware).forRoutes(AuthController, Auth_AgencyController);
    consumer.apply(LoggingMiddleware).forRoutes(AuthController, Auth_AgencyController);
  }
}
