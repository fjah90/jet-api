import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class GetHealthResponse {
  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  status: boolean;
}
