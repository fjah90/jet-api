import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { ReservationDto } from './reservation.dto';

export class CreatePnrRequest {
  @ApiProperty()
  @IsString()
  @MaxLength(30)
  token: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  balance?: string = '';

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(15)
  currency?: string = '';

  @ApiProperty()
  @ValidateNested()
  @Type(() => ReservationDto)
  reservationInfo: ReservationDto;
}
