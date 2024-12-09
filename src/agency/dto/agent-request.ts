import { IsNotEmpty } from 'class-validator';
import { RadixxToken } from './radixx-token';
import { ApiProperty } from '@nestjs/swagger';

export class AgentRequest extends RadixxToken {
  @ApiProperty()
  @IsNotEmpty()
  UserId: string;
  @ApiProperty()
  @IsNotEmpty()
  IATA: string;
}
