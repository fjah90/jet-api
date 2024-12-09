import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class getMenuMiPiaceTextResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
