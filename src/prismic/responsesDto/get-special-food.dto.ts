import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ElementOfDocumentResponse } from './element-of-document.dto';
import { SpecialFoodResponse } from './special-food.dto';

export class GetSpecialFoodResponse {
  @ApiProperty()
  @IsNotEmpty()
  specialFoods: SpecialFoodResponse[];

  @ApiProperty()
  @IsNotEmpty()
  specialFoodsTerms: ElementOfDocumentResponse[];
}
