import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getAuth } from 'firebase-admin/auth';
import firebaseAdmin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { Config } from './common-middleware.config';
import { isJWT } from 'class-validator';
import { JsonLogger } from 'src/utils/json-logger';
import { SessionRegistryService } from '../src/session-registry/session-registry.service';

@Injectable()
export class CommonMiddleware implements NestMiddleware {
  private privateKey: string;
  private projectId: string;
  private clientEmail: string;
  private databaseUrl: string;
  private logger = new JsonLogger(CommonMiddleware.name);
  private static sessionRegistryService: SessionRegistryService;

  constructor(private configService: ConfigService<Config>, sessionRegistryService: SessionRegistryService) {
    this.privateKey = this.configService.get<string>('FIREBASE_PRIVATEKEY');
    this.projectId = this.configService.get<string>('FIREBASE_PROJECTID_WEB');
    this.clientEmail = this.configService.get<string>('FIREBASE_CLIENTEMAIL');
    this.databaseUrl = this.configService.get<string>('FIREBASE_DATABASE_URL_WEB');
    CommonMiddleware.sessionRegistryService = sessionRegistryService;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const firebaseToken = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : '';
    if (!isJWT(firebaseToken)) return res.status(401).json('Invalid JWT token');
    try {
      const app = !firebaseAdmin.apps.length
        ? firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert({
              projectId: this.projectId,
              clientEmail: this.clientEmail,
              privateKey: this.privateKey.replace(/\\n/gm, '\n'),
            }),
            databaseURL: this.databaseUrl,
          })
        : firebaseAdmin.app();
      const user = await getAuth(app).verifyIdToken(firebaseToken);

      if (!user) return res.status(401).json('Expired or invalid token received');
      await CommonMiddleware.sessionRegistryService.getOrCreateByFirebaseToken(firebaseToken);
      this.logger.log(`userId: ${user.user_id.slice(0, 5)}, [${req.method}] ${req.originalUrl}`);
      this.logger.log(`userId: ${user.user_id.slice(0, 5)}, Request: ${JSON.stringify(req.body)}`);
      req.user = user.user_id.slice(0, 5);
      return next();
    } catch (error) {
      this.logger.log(`[${req.method}] ${req.originalUrl}`);
      this.logger.log('Failed login: ' + JSON.stringify(error.message));
      return res.status(401).json(error);
    }
  }
}
