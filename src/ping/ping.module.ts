import { Module } from '@nestjs/common';
import { PingService } from './ping.service';
import { PingController } from './ping.controller';
import { StatsdService } from 'src/statsd/statsd.service';

@Module({
  controllers: [PingController],
  providers: [PingService, StatsdService],
})
export class PingModule {}
