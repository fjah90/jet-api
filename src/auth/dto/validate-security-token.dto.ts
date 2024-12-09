import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ValidateSecurityTokenDto {
  @ApiProperty({
    description: 'Token Guid',
    example: '12903809efuhfdsf823yr',
  })
  @IsNotEmpty()
  token: string;
}
