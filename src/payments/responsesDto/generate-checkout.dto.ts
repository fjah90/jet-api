import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateCheckoutResponse {
  @ApiProperty({ description: 'checkout URL' })
  @IsString()
  @IsNotEmpty()
  checkoutUrl: string;

  @ApiProperty({ description: 'Confirmation Number' })
  @IsString()
  @IsNotEmpty()
  confirmationNumber: string;
}
