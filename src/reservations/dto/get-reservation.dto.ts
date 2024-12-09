import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsAlphanumeric, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { GetDocumentByLanguageDto } from 'src/prismic/dto';
import { Transform } from 'class-transformer';

export class GetReservationDto extends PickType(GetDocumentByLanguageDto, ['lang'] as const) {
  @ApiProperty({
    description: 'Confirmation code to track flight',
    example: 'XF49GB',
  })
  @IsString()
  @IsNotEmpty()
  @Transform((params) => params.value.toUpperCase().replace(/\s/g, ''))
  @MaxLength(6)
  @IsAlphanumeric()
  confirmationNumber: string;

  @ApiProperty({
    description: 'Surname of the person to track',
    example: 'Smith',
  })
  @IsString()
  @IsNotEmpty()
  @Transform((params) => params.value.toUpperCase().replace(/\s/g, ''))
  @MaxLength(300)
  @IsAlphanumeric()
  lastName?: string;
}

export class GetReservationDetailDto extends GetDocumentByLanguageDto {
  @ApiProperty({
    description: 'Confirmation code to track flight',
    example: 'XF49GB',
  })
  @IsString()
  @IsNotEmpty()
  @Transform((params) => params.value.toUpperCase().replace(/\s/g, ''))
  @MaxLength(6)
  @IsAlphanumeric()
  confirmationNumber: string;

  @ApiProperty({
    description: 'Surname of the person to track',
    example: 'Smith',
  })
  @IsString()
  @IsNotEmpty()
  @Transform((params) => params.value.toUpperCase().replace(/\s/g, ''))
  @MaxLength(300)
  @IsAlphanumeric()
  lastName?: string;
}
