import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class PassengerByTypeDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(2)
  passengerTypeID: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(2)
  @IsNotEmpty()
  totalSeatsRequired: number;

  public toXml(): any {
    return {
      'rad1:FareQuoteRequestInfo': {
        'rad1:PassengerTypeID': this.passengerTypeID,
        'rad1:TotalSeatsRequired': this.totalSeatsRequired,
      },
    };
  }
}
