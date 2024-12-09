import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ValidationPipe,
  CacheInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { SessionRegistryService } from './session-registry.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';

@UseInterceptors(SentryInterceptor)
@Controller('session-registry')
export class SessionRegistryController {
  constructor(private readonly sessionRegistryService: SessionRegistryService) {}

  @UseInterceptors(CacheInterceptor)
  @Post('/')
  async something(@Body(ValidationPipe) { firebaseToken }: { firebaseToken: string }) {
    return this.sessionRegistryService.getOrCreateByFirebaseToken(firebaseToken);
  }
}
