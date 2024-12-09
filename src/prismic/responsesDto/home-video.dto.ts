import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class HomeVideoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  link: string;
}
