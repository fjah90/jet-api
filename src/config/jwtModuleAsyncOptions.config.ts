import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const jwtModuleAsyncOptions: JwtModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('server.secret'),
    signOptions: {
      expiresIn: configService.get<string>('server.expirationTime'),
    },
  }),
  inject: [ConfigService],
};
