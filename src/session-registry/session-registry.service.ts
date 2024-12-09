import { Injectable } from '@nestjs/common';
// import { SessionRegistryRepository } from './session-registry.repository';
import { AuthService } from 'src/auth/auth.service';
import { JsonLogger } from 'src/utils/json-logger';
import { StatsdService } from 'src/statsd/statsd.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class SessionRegistryService {
  private logger = new JsonLogger(SessionRegistryService.name);
  private redis: Redis;
  constructor(
    private authService: AuthService,
    private readonly redisService: RedisService,
    private statsdService: StatsdService
  ) {
    this.redis = this.redisService.getClient();
  }

  async getOrCreateByFirebaseToken(firebaseToken: string) {
    let session = await this.redis.get(firebaseToken);
    // if (session) {
    //   this.logger.log('No se necesita renovacion de token' + JSON.stringify(session));
    //   this.logger.log(
    //     `token: ${firebaseToken.slice(firebaseToken.length - 6)}-${String(session).slice(String(session).length - 6)}`
    //   );
    // } else {
    //   await this.authService.retrieveSecurityToken();
    //   await this.cacheService.store.set(firebaseToken, this.authService.radixxToken, {
    //     ttl: process.env.CACHE_SERVER_TTL,
    //   });
    //   session = await this.cacheService.get(firebaseToken);
    //   this.logger.log('Se creo un nuevo token ' + JSON.stringify(session) + ' ' + firebaseToken);
    // }

    if (!session) {
      await this.authService.retrieveSecurityToken();
      const start = Date.now();
      await this.redis.set(firebaseToken, this.authService.radixxToken);
      session = await this.redis.get(firebaseToken);
      const end = Date.now();
      await this.statsdService?.timing('_redis_response_time', end - start);
    }
    return session;
  }
}
