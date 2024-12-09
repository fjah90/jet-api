import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserAgentMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Guardamos el user-agent directamente en el servicio AuthService
    this.authService.setUserAgent(userAgent);
    
    next();
  }
}