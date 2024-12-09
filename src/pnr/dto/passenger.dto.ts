import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBooleanString, IsDateString, IsString, MaxLength, ValidateNested } from 'class-validator';
import { AddressDto } from './address.dto';
import { ContactDto } from './contact.dto';

export class PassengerDto {
  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(40)
  personOrgID: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  firstName: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  lastName: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  middleName: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(10)
  age: string;

  @ApiProperty()
  @IsDateString()
  DOB: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(40)
  gender: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(40)
  title: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(40)
  nationalityLaguageID = '1';

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(40)
  relationType: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(40)
  WBCID: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(10)
  PTCID: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(40)
  PTC: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(40)
  travelsWithPersonOrgID: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  redressNumber: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  knownTravelerNumber: string;

  @ApiProperty()
  @IsBooleanString()
  @MaxLength(300)
  marketingOptIn: string;

  @ApiProperty()
  @IsBooleanString()
  @MaxLength(300)
  useInventory: string;

  @ApiProperty()
  @ValidateNested()
  z;
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ default: '' })
  @IsString()
  company: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(300)
  comments: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(100)
  passport: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(30)
  nationality: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(40)
  profileId: string;

  @ApiProperty({ default: '' })
  @IsString()
  datePasaporte: string;

  @ApiProperty({ default: '' })
  @IsString()
  @MaxLength(60)
  issueCountry: string;

  @ApiProperty()
  @IsBooleanString()
  isPrimaryPassenger: string;

  @ApiProperty()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts: ContactDto[];

  public toXml() {
    return {
      'rad1:Person': {
        'rad1:PersonOrgID': this.personOrgID,
        'rad1:FirstName': this.firstName,
        'rad1:LastName': this.lastName,
        'rad1:MiddleName': this.middleName,
        'rad1:Age': this.age,
        'rad1:DOB': this.DOB,
        'rad1:Gender': this.mapRadixxGender(this.gender),
        'rad1:Title': this.title,
        'rad1:NationalityLaguageID': this.nationalityLaguageID,
        'rad1:RelationType': this.relationType,
        'rad1:WBCID': this.WBCID,
        'rad1:PTCID': this.PTCID,
        'rad1:PTC': this.PTC,
        'rad1:TravelsWithPersonOrgID': this.travelsWithPersonOrgID,
        'rad1:RedressNumber': this.redressNumber,
        'rad1:KnownTravelerNumber': this.knownTravelerNumber,
        'rad1:MarketingOptIn': this.marketingOptIn,
        'rad1:UseInventory': this.useInventory,
        'rad1:Address': this.address.toXml(),
        'rad1:Company': this.company,
        'rad1:Comments': this.comments,
        'rad1:Passport': this.passport,
        'rad1:Nationality': this.nationality,
        'rad1:ProfileId': this.profileId,
        'rad1:IsPrimaryPassenger': this.isPrimaryPassenger,
        'rad1:ContactInfos': this.contacts.map((contact) => contact.toXml()),
      },
    };
  }

  private mapRadixxGender(gender: string): string {
    if (gender.toLowerCase() == 'femenino') {
      return 'Female';
    } else if (gender.toLowerCase() == 'masculino') {
      return 'Male';
    } else {
      return 'Male';
    }
  }
}

export class PassengerApiInfoDto {
  @ApiProperty({ default: '' })
  @IsString()
  personOrgID: string;

  @ApiProperty({ default: '' })
  @IsString()
  passport: string;

  @ApiProperty({ default: '' })
  @IsString()
  datePasaporte: string;

  @ApiProperty({ default: '' })
  @IsString()
  issueCountry: string;

  @ApiProperty({ default: '' })
  @IsString()
  firstName: string;

  @ApiProperty({ default: '' })
  @IsString()
  lastName: string;

  @ApiProperty({ default: '' })
  @IsString()
  middleName: string;

  @ApiProperty({ default: '' })
  @IsString()
  country: string;

  @ApiProperty({ default: '' })
  @IsString()
  nationality: string;
}
