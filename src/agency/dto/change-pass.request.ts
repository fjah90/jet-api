import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches, MinLength } from 'class-validator';
import { RadixxToken } from './radixx-token';

const passwordRegexp = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/;
export class ChangePassRequest extends RadixxToken {
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
  currentpassword: string;

  @ApiProperty({
    description: 'New Password to register',
    example: 'Ex@mple123',
  })
  @IsNotEmpty()
  @MinLength(6)
  @Matches(passwordRegexp, {
    message: 'Password should contain at least one upper case, one lower case, one digit and one symbol',
  })
  newpassword: string;
}
