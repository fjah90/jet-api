import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { CreateCheckinDto } from './create-checkin.dto';

export class CreateCheckinAgencyDto extends CreateCheckinDto {
  @ApiProperty()
  @IsNotEmpty()
  token: string;
  @ApiProperty()
  @IsNotEmpty()
  IATA: string;
}
