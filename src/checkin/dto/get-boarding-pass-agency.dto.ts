import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { GetReservationDto } from 'src/reservations/dto';

export class GetBoardingPassAgencyDto extends OmitType(GetReservationDto, ['lastName'] as const) {
  @ApiProperty()
  @IsNotEmpty()
  token: string;
  @ApiProperty()
  @IsNotEmpty()
  IATA: string;
}
