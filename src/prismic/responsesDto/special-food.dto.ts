import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SpecialFoodResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;
}
