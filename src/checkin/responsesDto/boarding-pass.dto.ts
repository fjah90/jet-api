import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetBoardingPassResponse {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  origin: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  destination: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  operatingFlightNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  confirmationNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  departureDate: Date;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  dayOfYear: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  seat: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  boardingPassNumber: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  flightOperator: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  classOfPassenger: string;

  @ApiProperty()
  @IsBoolean()
  hasTickets: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNumber()
  age: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  serviceBundle: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  boardingPass: string;
}
