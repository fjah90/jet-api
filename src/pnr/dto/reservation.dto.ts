import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, MaxLength, IsAlphanumeric } from 'class-validator';

export class ReservationDto {
  //generate constructor for this class
  constructor(init?: Partial<ReservationDto>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(3)
  seriesNumber = '299';

  @ApiProperty()
  @IsString()
  @IsOptional()
  @MaxLength(6)
  @IsAlphanumeric()
  confirmationNumber = '';
}
