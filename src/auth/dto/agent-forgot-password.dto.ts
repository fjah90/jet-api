/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AgentForgotPasswordDto {
  @ApiProperty({
        description: 'Email registered',
        example: 'example@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'Username associated to account',
        example: 'JonDoe',
    })
    @IsNotEmpty()
    username: string;
}