import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RadixxToken {
  @ApiProperty()
  @IsNotEmpty()
  token: string;
}
