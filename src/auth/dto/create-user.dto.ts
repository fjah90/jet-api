import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

const passwordRegexp = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/;
export class CreateUserDto {
  @ApiProperty({
    description: 'Email to register into firebase',
    example: 'example@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Username to use when login',
    example: 'example',
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Password to register',
    example: 'Ex@mple123',
  })
  @IsNotEmpty()
  @MinLength(6)
  @Matches(passwordRegexp, {
    message: 'Password should contain at least one upper case, one lower case, one digit and one symbol',
  })
  password: string;
}
