import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCheckinResponse {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  statusCode: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  statusMessage: string;
}
