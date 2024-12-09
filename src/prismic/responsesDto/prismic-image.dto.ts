import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ImageDimensionsResponse } from './image-dimensions.dto';

export class PrismicImageResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  alt: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  copyright: string;

  @ApiProperty()
  @IsNotEmpty()
  dimensions: ImageDimensionsResponse;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;
}
