import { IsNotEmpty, IsString } from 'class-validator';
import { CreateCheckinResponse } from './create-checkin.dto';
import { ApiProperty } from '@nestjs/swagger';

export class PostSendEmailResponse {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
