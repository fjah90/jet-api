import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetBannerResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  links: string[];

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  config: number;
}
