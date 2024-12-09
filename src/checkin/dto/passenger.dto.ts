import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class PassengerOfCheckinDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\d+:\d+)$/, { message: 'The format is invalid' })
  airLinePersonKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^(\d+:\d+)$/, { message: 'The format is invalid' })
  seatAssignmentKey: string;
}
