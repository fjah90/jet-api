import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetTermsAndConditionsTextResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
