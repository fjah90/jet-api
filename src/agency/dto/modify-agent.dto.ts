import { IsEmpty, IsNotEmpty } from 'class-validator';
import { RadixxToken } from './radixx-token';
import { ApiProperty } from '@nestjs/swagger';
import { Int32 } from 'typeorm';

export class ModifyAgentDto extends RadixxToken {
  @ApiProperty({
    description: 'IATA to Agency',
    example: '1234',
  })
  @IsNotEmpty()
  IATA: string;
  @ApiProperty()
  @IsNotEmpty()
  AgentUserName: string;
  @ApiProperty()
  @IsEmpty()
  AgentFirstName: string;
  @ApiProperty()
  @IsEmpty()
  AgentLastName: string;
  @ApiProperty()
  @IsEmpty()
  AgentAdress1: string;
  @ApiProperty()
  @IsEmpty()
  AgentAdress2: string;
  @ApiProperty()
  @IsEmpty()
  AgentCity: string;
  @ApiProperty()
  @IsEmpty()
  AgentPostalCode: string;
  @ApiProperty()
  @IsEmpty()
  AgentCountry: string;
  @ApiProperty()
  @IsEmpty()
  AgentEmail: string;
  @ApiProperty()
  @IsEmpty()
  AgentState: string;
}
