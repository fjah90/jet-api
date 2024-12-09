import { Module } from '@nestjs/common';
import { SessionRegistryService } from './session-registry.service';
import { AuthService } from 'src/auth/auth.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import { AuthRemoteRepository } from 'src/auth/auth.remote-repository';
import { StatsdService } from 'src/statsd/statsd.service';

@Module({
  imports: [],
  providers: [SessionRegistryService, AuthService, FirebaseService, AuthRemoteRepository, StatsdService],
  exports: [SessionRegistryService],
})
export class SessionRegistryModule {}
