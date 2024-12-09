import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { AirportResponse } from './airport.dto';

export class GetAirportsResponse {
  @ApiProperty()
  @IsNotEmpty()
  airports: AirportResponse[];
}
