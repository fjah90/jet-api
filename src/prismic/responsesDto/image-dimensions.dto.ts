import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ImageDimensionsResponse {
  @ApiProperty()
  @IsNotEmpty()
  width: number;

  @ApiProperty()
  @IsNotEmpty()
  height: number;
}
