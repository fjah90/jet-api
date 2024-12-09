import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AddressDto {

    // create a constructor for this class
    constructor(init?: Partial<AddressDto>) {
        Object.assign(this, init);
    }

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    address1: string = '';

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    address2: string = '';

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    city: string = '';

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    state: string = '';

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    postal: string = '';

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    country: string = '';

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    countryCode: string = '';

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    areaCode: string = '';

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    phoneNumber: string = '';

    @ApiProperty()
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(300)
    display: string = '';

    public toXml() {
        return {
            'rad1:Address1': this.address1,
            'rad1:Address2': this.address2,
            'rad1:City': this.city,
            'rad1:State': this.state,
            'rad1:Postal': this.postal,
            'rad1:Country': this.country,
            'rad1:CountryCode': this.countryCode,
            'rad1:AreaCode': this.areaCode,
            'rad1:PhoneNumber': this.phoneNumber,
            'rad1:Display': this.display
        }
    }
}
