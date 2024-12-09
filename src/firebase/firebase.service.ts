import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseApp, FirebaseOptions, initializeApp } from 'firebase/app';
import { Config } from './interfaces/config';
import { Auth, getAuth } from 'firebase/auth';

@Injectable()
export class FirebaseService {
  public app: FirebaseApp;
  public auth: Auth;
  private firebaseOptions: FirebaseOptions;
  constructor(private configService: ConfigService<Config>) {
    this.firebaseOptions = {
      apiKey: this.configService.get<string>('FIREBASE_APIKEY_WEB'),
      appId: this.configService.get<string>('FIREBASE_APPID_WEB'),
      authDomain: this.configService.get<string>('FIREBASE_AUTHDOMAIN_WEB'),
      messagingSenderId: this.configService.get<string>('FIREBASE_MESSAGINGSENDERID_WEB'),
      projectId: this.configService.get<string>('FIREBASE_PROJECTID_WEB'),
      storageBucket: this.configService.get<string>('FIREBASE_STORAGEBUCKET_WEB'),
    };
    this.app = initializeApp(this.firebaseOptions);
    this.auth = getAuth(this.app);
  }
}
