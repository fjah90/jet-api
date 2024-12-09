import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

class DimensionsDTO {
  @IsNumber()
  @ApiProperty()
  width: number;

  @IsNumber()
  @ApiProperty()
  height: number;
}

class BundleIconDTO {
  @ApiProperty({ type: () => DimensionsDTO })
  dimensions: DimensionsDTO;

  @IsString()
  @ApiProperty()
  alt: string;

  @IsString()
  @ApiProperty()
  copyright: string;

  @IsString()
  @ApiProperty()
  url: string;
}

class ServiceDTO {
  bundleGroupIndex: number;

  @IsString()
  @ApiProperty()
  standaloneServiceCode: string;

  @IsString()
  @ApiProperty()
  title: string;

  @IsString()
  @ApiProperty()
  applicableBundleCode: string;

  @IsNumber()
  @ApiProperty()
  displayOrder: number;

  @ApiProperty({ type: () => BundleIconDTO })
  bundleIcon: BundleIconDTO;
}
export class GetServicesBundleDto {
  @IsString()
  @ApiProperty()
  logicalFlightID: string;

  @IsString()
  @ApiProperty()
  codeType: string;

  @IsString()
  @ApiProperty()
  description: string;

  @IsString()
  @ApiProperty()
  serviceID: string;

  @IsString()
  @ApiProperty()
  categoryID: string;

  @IsString()
  @ApiProperty()
  physicalFlightID: string;

  @IsString()
  @ApiProperty()
  amount: string;

  @IsString()
  @ApiProperty()
  currencyCode: string;

  @IsString()
  @ApiProperty({ type: () => [ServiceDTO] })
  services: ServiceDTO[];
}
