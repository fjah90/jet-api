import { Inject, Injectable, Scope } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserSignInDto } from './dto/user-sign-in.dto';
import { getClientSource } from './dto/user-agent.dto';
import { FirebaseService } from '../firebase/firebase.service';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, UserCredential } from 'firebase/auth';
import { AuthRemoteRepository } from './auth.remote-repository';
import { ConfigService } from '@nestjs/config';
import { Configuration } from './interface/configuration.interface';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { REQUEST } from '@nestjs/core';


@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  
  public isRadixxTokenValid = false;
  private radixxUsername: string;
  private radixxPassword: string;
  private radixxWebUsername: string;
  private radixxWebPassword: string;
  public radixxToken: string;
  private redis: Redis;
  private userAgent: string; 

  constructor(
    @Inject(REQUEST) private readonly request: Request,
    private configService: ConfigService<Configuration>,
    private firebaseService: FirebaseService,
    private authRemoteRepository: AuthRemoteRepository,
    private readonly redisService: RedisService
    
  ) {
    this.redis = this.redisService.getClient();
    this.radixxUsername = this.configService.get<string>('RADIXX_USERNAME');
    this.radixxPassword = this.configService.get<string>('RADIXX_PASSWORD');
    this.radixxWebUsername = this.configService.get<string>('RADIXX_WEB_USERNAME');
    this.radixxWebPassword = this.configService.get<string>('RADIXX_WEB_PASSWORD');
    this.userAgent = request.headers['user-agent'] || 'unknown';
  }

  // Método para establecer el user-agent
  public setUserAgent(userAgent: string) {
    this.userAgent = userAgent;
  }

  public async getRadixxTokenFromCache(firebaseToken: string) {
    return (await this.redis.get(firebaseToken)) as string;
  }

  public async retrieveSecurityToken() {

    const clientSource = getClientSource(this.userAgent);
    if (clientSource === 'web') {
      console.log(`[USERAGENT]: ${this.userAgent}`);
      return (this.radixxToken = await this.authRemoteRepository.retrieveSecurityToken({
        username: this.radixxWebUsername,
        password: this.radixxWebPassword,
      }));
    } else {
      console.log(`[USERAGENT]: ${this.userAgent}`);
      return (this.radixxToken = await this.authRemoteRepository.retrieveSecurityToken({
        username: this.radixxUsername,
        password: this.radixxPassword,
      }));
    }
  }

  public async validateSecurityToken() {
    this.isRadixxTokenValid = await this.authRemoteRepository.validateSecurityToken({ token: this.radixxToken });
  }

  public async signUp(createUserDto: CreateUserDto): Promise<string> {
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        this.firebaseService.auth,
        createUserDto.email,
        createUserDto.password
      );
      if (userCredential) {
        return 'Account created!';
      }
    } catch (error) {
      console.error(`[ERROR]: ${error}`);
    }
  }

  async signIn(userSignInDto: UserSignInDto) {
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        this.firebaseService.auth,
        userSignInDto.email,
        userSignInDto.password
      );
      return userCredential;
    } catch (error) {
      console.error(`[ERROR]: ${error}`);
    }
  }

  async regenerateToken(firebaseToken: string) {
    return await this.redis.set(firebaseToken, await this.retrieveSecurityToken());
  }
}
