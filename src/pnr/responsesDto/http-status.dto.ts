import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class HttPStatusResponse {
  @ApiProperty()
  @IsString()
  response: string;

  @ApiProperty()
  @IsNumber()
  status: number;

  @ApiProperty()
  @IsString()
  options: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  name: string;

  constructor(response: string, status: number, message: string, name: string) {
    this.response = response;
    this.status = status;
    this.options = undefined;
    this.message = message;
    this.name = name;
  }
}

export const UpdatePassengerResponse = new HttPStatusResponse(
  'Passengers successfully modified',
  200,
  'Passengers successfully modified',
  'HttpException'
);

export const ModifyPnrResponse = new HttPStatusResponse(
  'Pnr was successfully modified',
  200,
  'Pnr was successfully modified',
  'HttpException'
);
