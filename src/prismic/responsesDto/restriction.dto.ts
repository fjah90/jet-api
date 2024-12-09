import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ElementOfDocumentResponse } from './element-of-document.dto';

export class RestrictionResponse {
  @ApiProperty()
  @IsNotEmpty()
  elements: ElementOfDocumentResponse[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lang: string;
}
