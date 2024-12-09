import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { SpanElementResponse } from './span-element.dto';

export class ElementOfDocumentResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ type: () => [SpanElementResponse] })
  @IsNotEmpty()
  spans: SpanElementResponse[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  url: string;
}
