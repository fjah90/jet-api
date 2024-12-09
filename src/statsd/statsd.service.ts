import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as StatsD from 'node-statsd';
import { Configuration } from './interface/configuration.interface';

@Injectable()
export class StatsdService {
  private client: StatsD;

  constructor(private configService: ConfigService<Configuration>) {
    /* this.client = new StatsD({
      host: process.env.STATSD_HOST,
      port: process.env.STATSD_PORT,
      prefix: 'iberojet',
      global_tags: [`tag_Env:${process.env.TAG}`, `env:${process.env.TAG}`],
    }); */
  }

  public async increment(key: string): Promise<void> {
    /* this.client.increment(key); */
  }

  public async timing(key: string, timeMs: number): Promise<void> {
    /* this.client.timing(key, timeMs); */
  }

  public async gauge(key: string, value: number): Promise<void> {
    /* this.client.gauge(key, value); */
  }
}
