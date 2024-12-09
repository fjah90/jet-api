import { Person } from 'src/reservations/responsesDto/get-reservation.dto';
import { PassengerApiInfoDto } from './dto/passenger.dto';
import { SpecialServicesDto } from './dto/special-services.dto';
import { info } from 'console';

export interface PassengerToUpdate {
  'rad1:ApisInformation': {
    // 'rad1:PersonOrgID': string;
    'rad1:ApisInfoIndex': string;
    'rad1:RecordNumber': string;
    'rad1:LastName': string;
    'rad1:FirstName': string;
    'rad1:MiddleName': string;
    'rad1:DocumentType1': number;
    'rad1:DocumentNumber': string;
    'rad1:IssueCountry1': string;
    'rad1:ExpirationDate1': string;
    'rad1:ResidenceCountry': string;
    'rad1:BirthDate': string;
    'rad1:Citizenship': string;
    // 'rad1:BirthCountry': string;
    // 'rad1:DocumentType2': string;
    // 'rad1:DocumentNumber2': string;
    // 'rad1:IssueCountry2': string;
    // 'rad1:ExpirationDate2': string;
    // 'rad1:ResultCode': string;
    'rad1:PhysicalFlightId': string;
    'rad1:ActualDepartureDate': string;
    'rad1:FlightNumber': string;
    'rad1:DocumentScanned1': string;
    'rad1:DocumentScanned2': string;
  };
}

export class PnrConverter {
  private mapRadixxGender(gender: string): string {
    if (gender.toLowerCase() == 'femenino') {
      return 'Female';
    } else if (gender.toLowerCase() == 'masculino') {
      return 'Male';
    } else {
      return 'Male';
    }
  }
  public updatePassengerInformation(passenger: PassengerApiInfoDto, apiInfo: any) {
    const passengerObject: PassengerToUpdate = {
      'rad1:ApisInformation': {
        'rad1:ApisInfoIndex': apiInfo['a:ApisInfoIndex'],
        'rad1:RecordNumber': apiInfo['a:RecordNumber'],
        'rad1:LastName': passenger.lastName,
        'rad1:FirstName': passenger.firstName,
        'rad1:MiddleName': passenger.middleName,
        'rad1:BirthDate': apiInfo['a:BirthDate'],
        'rad1:Citizenship': passenger.nationality.toUpperCase(),
        'rad1:ResidenceCountry': passenger.country.toUpperCase(),
        // 'rad1:BirthCountry': passenger.nationality.toUpperCase(),
        'rad1:DocumentType1': 1,
        'rad1:DocumentNumber': passenger.passport,
        'rad1:IssueCountry1': passenger.issueCountry.toUpperCase(),
        'rad1:ExpirationDate1': passenger.datePasaporte,
        'rad1:PhysicalFlightId': apiInfo['a:PhysicalFlightID'],
        'rad1:ActualDepartureDate': apiInfo['a:ActualDepartureDate'],
        'rad1:FlightNumber': apiInfo['a:FlightNumber'],
        'rad1:DocumentScanned1': apiInfo['a:DocumentScanned1'],
        'rad1:DocumentScanned2': apiInfo['a:DocumentScanned2'],
        // 'rad1:PersonOrgID': passenger.personOrgID,
        // 'rad1:DocumentType2': apiInfo['a:DocumentType2'],
        // 'rad1:DocumentNumber2': apiInfo['a:DocumentNumber2'],
        // 'rad1:IssueCountry2': apiInfo['a:IssueCountry2'],
        // 'rad1:ExpirationDate2': apiInfo['a:ExpirationDate2'],
        // 'rad1:ResultCode': apiInfo['a:ResultCode'] || 0,
      },
    };
    return passengerObject;
  }
  public addSpecialServices(specialServices: SpecialServicesDto) {
    const specialServicesObject = {
      'rad1:SpecialService': {
        'rad1:CodeType': specialServices.codeType,
        'rad1:ServiceID': specialServices.serviceId,
        'rad1:SSRCategory': specialServices.ssrCategory,
        'rad1:LogicalFlightID': specialServices.logicalFlightId,
        'rad1:DepartureDate': specialServices.departureDate,
        'rad1:Amount': specialServices.amount,
        'rad1:OverrideAmount': specialServices.overrideAmount,
        'rad1:CurrencyCode': specialServices.currencyCode,
        'rad1:Commissionable': specialServices.commissionable ?? false,
        'rad1:Refundable': specialServices.refundable ?? false,
        'rad1:ChargeComment': specialServices.chargeComment,
        'rad1:PersonOrgID': specialServices.personOrgId,
        'rad1:OverrideAmtReason': specialServices.overrideAmtReason ?? false,
        'rad1:ExtPenaltyRule': specialServices.extPenaltyRule ?? false,
        'rad1:ExtIsRePriceFixed': specialServices.extIsRePriceFixed ?? false,
        'rad1:ExtRePriceSourceName': specialServices.extRePriceSourceName ?? false,
        'rad1:ExtRePriceValue': specialServices.extRePriceValue ?? false,
        'rad1:ExtRePriceValueReason': specialServices.extRePriceValueReason ?? false,
        'rad1:ServiceBundleCode': specialServices.serviceBundleCode ?? false,
      },
    };
    return specialServicesObject;
  }
}
