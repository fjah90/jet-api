import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, isArray } from 'class-validator';

export class GetAgencyCreateResponse {

  @IsString()
  @ApiProperty({ description: 'IATA Code' })
  iata: string;

  @IsString()
  @ApiProperty({ description: 'Logical Flight ID' })
  logicalFlightID: string;

  @IsString()
  @ApiProperty({ description: 'Confirmation Number' })
  confirmationNumber: string;
}
