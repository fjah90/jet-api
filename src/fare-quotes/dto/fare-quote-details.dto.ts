import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { FareDetailDto } from './fare-detail.dto';

export class FareQuoteDetailsDto {
  @ApiProperty()
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currencyCode: string;

  @ApiPropertyOptional()
  @IsString()
  @MaxLength(60)
  @IsOptional()
  promotionalCode = '';

  @ApiProperty({ type: FareDetailDto, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => FareDetailDto)
  @ArrayMinSize(1)
  fares: FareDetailDto[];
}
