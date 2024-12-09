// src/auth/interceptors/user-agent.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable()
export class UserAgentInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'] || 'unknown';
    console.log('user-agent:', userAgent);

    // Establece el userAgent directamente en AuthService
    //this.authService.setUserAgent(userAgent);

    return next.handle();
  }
}