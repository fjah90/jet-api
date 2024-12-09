import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetHealthStatementsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  health_statements: string;
}
