import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class UserSignInDto {
  @ApiProperty({
    description: 'Email registered in firebase',
    example: 'example@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password associated to account',
    example: 'Ex@mple123',
  })
  @IsNotEmpty()
  password: string;
}
