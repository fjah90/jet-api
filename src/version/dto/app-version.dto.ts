import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AppVersionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  minimum_ios_version: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  minimum_android_version: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  minimum_desirable_ios_version: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  minimum_desirable_android_version: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  servicing: string;
}
