import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { StatsdService } from 'src/statsd/statsd.service';

@Injectable()
export class PingService {
  private job: CronJob;
  constructor(private readonly statsdService: StatsdService) {}
  onModuleInit() {
    this.job = new CronJob(
      '*/20 * * * * *',
      () => {
        this.getPing();
      },
      null,
      true,
      'America/Los_Angeles'
    );

    this.job.start();
  }
  async getPing() {
    this.statsdService.gauge('_get_ping', 1);
    return JSON.stringify({});
  }
}
