import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AgencySignInDto {
  @ApiProperty({
    description: 'Username',
    example: 'JonDoe',
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Password associated to account',
    example: 'Ex@mple123',
  })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'TestV',
  })
  @IsNotEmpty()
  IATA: string;
}
