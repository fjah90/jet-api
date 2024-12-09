import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { GetReservationDto } from './get-reservation.dto';
import { GetDocumentByLanguageDto } from 'src/prismic/dto';
import { Type } from 'class-transformer';

export class RetrieveReservationsAgencyDto extends GetDocumentByLanguageDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;
  @ApiProperty({ isArray: true, type: GetReservationDto })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  @Type(() => GetReservationDto)
  reservations: GetReservationDto[];
}
