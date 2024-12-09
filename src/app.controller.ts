import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { StatsdService } from './statsd/statsd.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly statsdService: StatsdService) {}
}
