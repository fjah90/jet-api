import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const typeOrmModuleAsyncOptions: TypeOrmModuleAsyncOptions = {
  useFactory: (configService: ConfigService) => {
    const typeOrmConfigs = configService.get('database');

    return {
      ...typeOrmConfigs,
    };
  },
  inject: [ConfigService],
};
