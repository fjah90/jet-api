import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class getNoCheckInResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
