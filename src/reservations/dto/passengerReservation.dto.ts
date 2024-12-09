import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, MaxLength } from 'class-validator';
export class PassengerReservationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  key: string;

  @ApiProperty({ description: 'Adult = 1, child = 6, infant = 5 ', example: 1 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(3)
  passengerTypeID: string;
}

export class PassengerOfSeatListRequestDto extends PassengerReservationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  DOB: string;
}
