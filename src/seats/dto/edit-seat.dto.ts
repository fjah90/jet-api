import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateCheckinDto } from 'src/checkin/dto';
import { SeatElementDto } from '.';
import { type } from 'os';

export class EditSeatDto {
  @ApiProperty({ type: () => [SeatElementDto] })
  @IsNotEmpty()
  seats: SeatElementDto[];

  @ApiProperty()
  @IsString()
  reservationKey: string;

  @ApiProperty({
    description: 'Confirmation code to track flight',
    example: 'XF49GB',
  })
  @IsString()
  @IsNotEmpty()
  confirmationNumber: string;
}

export class EditSeatWithCustomerKeyDto extends EditSeatDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerKey: string;
}
