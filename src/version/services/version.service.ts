import { Injectable } from '@nestjs/common';
import { AppVersionDto } from '../dto/index';

@Injectable()
export class VersionService {
  async getAppVersion(): Promise<AppVersionDto> {
    return {
      minimum_ios_version: process.env.MINIMUM_IOS_VERSION,
      minimum_android_version: process.env.MINIMUM_ANDROID_VERSION,
      minimum_desirable_ios_version: process.env.MINIMUM_DESIRABLE_IOS_VERSION,
      minimum_desirable_android_version: process.env.MINIMUM_DESIRABLE_ANDROID_VERSION,
      servicing: JSON.parse(process.env.SERVICING),
    };
  }
}
