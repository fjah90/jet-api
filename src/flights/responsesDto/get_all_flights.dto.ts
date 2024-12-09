import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

class Destination {
  @ApiProperty({ description: 'The airport code of the destination' })
  @IsString()
  @IsNotEmpty()
  destinationAirportCode: string;

  @ApiProperty({ description: 'The name of the destination airport' })
  @IsString()
  @IsNotEmpty()
  destinationAirportName: string;

  @ApiProperty({ description: 'The description of the destination airport' })
  @IsString()
  @IsNotEmpty()
  destinationAirportDescription: string;

  @ApiProperty({ description: 'The country code of the destination airport' })
  @IsString()
  @IsNotEmpty()
  destinationAirportCountryCode: string;
}

export class OriginAndDestinationsResponse {
  @ApiProperty({ description: 'The airport code of the origin' })
  @IsString()
  @IsNotEmpty()
  originAirportCode: string;

  @ApiProperty({ description: 'The description of the origin airport' })
  @IsString()
  @IsNotEmpty()
  originAirportDescription: string;

  @ApiProperty({ description: 'The name of the origin airport' })
  @IsString()
  @IsNotEmpty()
  originAirportAirportName: string;

  @ApiProperty({ description: 'The country code of the origin airport' })
  @IsString()
  @IsNotEmpty()
  originAirportCountryCode: string;

  @ApiProperty({ description: 'The list of destinations from the origin', type: [Destination] })
  @IsNotEmpty()
  destinations: Destination[];
}
