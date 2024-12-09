import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ElementOfDocumentResponse } from './element-of-document.dto';

export class GetSecurityQuestionResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lang: string;

  @ApiProperty({ type: () => [ElementOfDocumentResponse] })
  @IsNotEmpty()
  elements: ElementOfDocumentResponse[];
}
