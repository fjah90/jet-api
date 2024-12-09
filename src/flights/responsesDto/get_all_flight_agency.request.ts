import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { LanguageDto } from 'src/prismic/dto';

export class GetAllFlightAgencyRequest extends LanguageDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;
}
