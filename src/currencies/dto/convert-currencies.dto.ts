import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { AvailableCurrencies } from '../interfaces/currencies-enum';

export class ConvertCurrenciesDto {
  @ApiProperty({ enum: AvailableCurrencies })
  @IsEnum(AvailableCurrencies)
  @IsNotEmpty()
  currencyToConvertFrom: AvailableCurrencies;

  @ApiProperty({ enum: AvailableCurrencies })
  @IsEnum(AvailableCurrencies)
  @IsNotEmpty()
  currencyToConvertTo: AvailableCurrencies;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amountToConvert: number;
}
