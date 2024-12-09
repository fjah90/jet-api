import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SpanElementResponse {
  @ApiProperty()
  @IsNotEmpty()
  start: number;

  @ApiProperty()
  @IsNotEmpty()
  end: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;
}
