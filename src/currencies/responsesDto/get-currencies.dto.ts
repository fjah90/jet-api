import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GetCurrenciesResponse {
  @IsString()
  @ApiProperty()
  currency: string;

  @IsString()
  @ApiProperty()
  sign: string;
}
