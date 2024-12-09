import { ApiProperty } from '@nestjs/swagger';
import {
  IsAlphanumeric,
  IsArray,
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PassengerOfCheckinDto } from './passenger.dto';

export class CreateCheckinDto {
  @ApiProperty({
    description: 'Series number to send to Radixx',
    example: 299,
  })
  @ApiProperty({
    description: 'Confirmation code to track flight',
    example: 'XF49GB',
  })
  @IsString()
  @MaxLength(6)
  @IsAlphanumeric()
  @IsNotEmpty()
  confirmationNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+:[A-Z0-9]+$/)
  reservationKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+:\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2} (AM|PM)$/)
  logicalFlightKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+:\d+:\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2}:\d{2} (AM|PM)$/)
  physicalFlightKey: string;

  @ApiProperty({ isArray: true, type: PassengerOfCheckinDto })
  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  passengers: PassengerOfCheckinDto[];
}
