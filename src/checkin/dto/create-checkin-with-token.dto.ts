import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreateCheckinDto } from '.';
export class CreateCheckinWihtTokenDto extends PartialType(CreateCheckinDto) {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerKey: string;
}
