import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

export class CreatePnrAgencyWebRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  iata: string;
  
  @MaxLength(100)
  @ApiProperty()
  @IsString()
  logicalFlightID: string;
}
