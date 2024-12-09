import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class GetFareQuoteResponse {
  @ApiProperty({ description: 'Unique identifier for the fare quote' })
  @IsString()
  @IsNotEmpty()
  LFID: string;

  @ApiProperty({ description: 'Departure date for the fare quote' })
  @IsString()
  @IsNotEmpty()
  departureDate: string;

  @ApiProperty({ description: 'Lowest fare price with tax' })
  @IsString()
  @IsNotEmpty()
  lowestFarePriceWithTax: number;

  @ApiProperty({ description: 'Indicates if the fare quote is the cheapest available' })
  @IsString()
  @IsNotEmpty()
  cheapest: boolean;
}
