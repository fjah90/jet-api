import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ContactDto {
  @ApiProperty({ default: '' })
  @IsString()
  @MinLength(0)
  @MaxLength(300)
  @Transform((param) => String(param.value))
  contactID: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  personOrgID: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  contactField: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  contactType: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  extension: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  countryCode: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  areaCode: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  phoneNumber: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  display: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  preferredContactMethod: string;

  public toXml() {
    return {
      'rad1:ContactInfo': {
        'rad1:ContactID': this.contactID,
        'rad1:PersonOrgID': this.personOrgID,
        'rad1:ContactField': this.contactField,
        'rad1:ContactType': this.contactType,
        'rad1:Extension': this.extension,
        'rad1:CountryCode': this.countryCode,
        'rad1:AreaCode': this.areaCode,
        'rad1:PhoneNumber': this.phoneNumber,
        'rad1:Display': this.display,
        'rad1:PreferredContactMethod': this.preferredContactMethod,
      },
    };
  }
}
