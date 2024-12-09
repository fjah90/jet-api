import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsString, isArray } from 'class-validator';

export class GetCreateResponse {
  @IsString()
  @ApiProperty({ description: 'Logical Flight ID' })
  logicalFlightID: string;

  @IsString()
  @ApiProperty({ description: 'Confirmation Number' })
  confirmationNumber: string;
}
