import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { ReservationDto } from './reservation.dto';

export class CreatePnrWebRequest {
  @MaxLength(100)
  @ApiProperty()
  @IsString()
  logicalFlightID: string;
}
