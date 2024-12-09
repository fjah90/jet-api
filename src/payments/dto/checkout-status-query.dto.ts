import { Transform } from 'class-transformer';
import { IsAlphanumeric, IsString, MaxLength } from 'class-validator';

export class CheckoutStatusQueryDto {
  @IsString()
  @Transform((param) => String(param.value))
  @MaxLength(3)
  public seriesNumber: string;

  @IsString()
  @MaxLength(6)
  @IsAlphanumeric()
  public confirmationNumber: string;

  @IsString()
  @MaxLength(30)
  @IsAlphanumeric()
  public status: string;
}
