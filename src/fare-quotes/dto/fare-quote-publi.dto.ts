import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class FareQuotePublicDto {
  @ApiProperty({ example: 'MAD' })
  @IsString()
  @MaxLength(3)
  @IsNotEmpty()
  originCode: string;

  @ApiProperty({ example: 'SJO' })
  @IsString()
  @MaxLength(3)
  @IsNotEmpty()
  destinationCode: string;

  @ApiProperty({ example: '2023-04-23' })
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  departureDate: string;

  @ApiProperty({ example: '2023-04-23' })
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '2023-05-23' })
  @IsString()
  @IsDateString()
  @IsOptional()
  dateEnd: string;

  @ApiProperty({ example: 'ES' })
  @IsString()
  languageCode: string;

  @ApiProperty({ example: 'EUR' })
  @IsString()
  @MaxLength(10)
  @IsNotEmpty()
  currencyCode: string;

  @ApiProperty({ example: 'IBERODAYS' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  promotionalCode: string;
}
