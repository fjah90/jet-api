import { ApiProperty, IntersectionType, OmitType, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty } from 'class-validator';
import { ReservationDto } from './reservation.dto';
import { CreateCheckinDto } from 'src/checkin/dto';
import { EditSeatDto } from 'src/seats/dto';
import { SpecialServicesDto } from './special-services.dto';
import { Type } from 'class-transformer';

export class ModifyPNRDto extends IntersectionType(
  OmitType(ReservationDto, ['seriesNumber'] as const),
  // PartialType(CreateCheckinDto),
  PartialType(EditSeatDto)
) {
  @ApiProperty({ type: () => [SpecialServicesDto] })
  @IsArray()
  @Type(() => SpecialServicesDto)
  @IsNotEmpty()
  specialServices: SpecialServicesDto[];

  // @ApiProperty()
  // @IsBoolean()
  // @IsNotEmpty()
  // doCheckin: boolean;
}
