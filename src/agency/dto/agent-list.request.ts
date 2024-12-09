import { IsNotEmpty } from 'class-validator';
import { RadixxToken } from './radixx-token';
import { ApiProperty } from '@nestjs/swagger';

export class AgentListRequest extends RadixxToken {
  @ApiProperty({
    description: 'IATA to Agency',
  })
  @IsNotEmpty()
  IATA: string;
}
