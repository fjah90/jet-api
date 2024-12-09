import { JsonLogger } from 'src/utils/json-logger';
import { Parser } from '../utils/json-xml.parser';
import { Formatter } from '../utils/xml.formatter';
import { EpgPaymentInputDto } from 'src/payments/dto/epg-payment-input.dto';
import { axiosInstance } from 'src/interceptors/axios.interceptor';
import { PaymentWithAgencyCreditDto } from 'src/payments/dto/credit-payment-input-agency.dto';

export class ApisInfoRemoteRepository {
  private logger = new JsonLogger('AddUpdateApisInfo');

  private mapRadixxGender(gender: string): string {
    if (gender.toLowerCase() == 'femenino') {
      return 'Female';
    } else if (gender.toLowerCase() == 'masculino') {
      return 'Male';
    } else {
      return 'Male';
    }
  }
  private async axiosClient(args, url, headers, actionType, user) {
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO BEFORE ${actionType}]`);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO AFTER ${actionType}] ${JSON.stringify(jsonResponse)} `);
    return jsonResponse;
  }

  public async addAUpdatepisInfo(request: any, confirmationNumber: string, token, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Reservation.svc`;
    const payload = {
      'tem:AddUpdateApisInfo': {
        'tem:AddApisInfoRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:SeriesNumber': 299,
          'rad1:ConfirmationNumber': confirmationNumber,
          'rad1:ApisInfos': request,
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Reservation/AddUpdateApisInfo',
      },
    };

    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Reservation');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'ADD/UPDATE APISINFO', user);
      return jsonResponse;
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  public async retrieveApisInfo({ token, confirmationNumber }, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Reservation.svc`;
    const payload = {
      'tem:RetrieveApisInfo': {
        'tem:RetrieveApisInfoRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:SeriesNumber': 299,
          'rad1:ConfirmationNumber': confirmationNumber,
          'rad1:OmitCancelled': false,
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Reservation/RetrieveApisInfo',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Reservation');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'RETRIEVE PNR APIS INFO', user);
      return jsonResponse;
    } catch (error) {
      this.logger.error('Failed retrieve: ' + JSON.stringify(error.message));
    }
  }

  private forceArray(object): any[] {
    return Array.isArray(object) ? object : [object];
  }

  public generatePayloadData(request: EpgPaymentInputDto, pnrData: any) {
    const payload = [];
    const flights = this.forceArray(pnrData.airlines.airline.logicalFlight.logicalFlight);
    flights.map((flight) => {
      const physicalFlights = this.forceArray(flight.physicalFlights.physicalFlight);
      physicalFlights.forEach((physicalFlight) => {
        // departureDate, physicalFlightID, logicalFlightID, flightNumber
        // <rad1: PhysicalFlightId > 276320 < /rad1:PhysicalFlightId>
        //   < rad1: ActualDepartureDate > 2023-05-26 < /rad1:ActualDepartureDate>
        //     < rad1: FlightNumber > 827 < /rad1:FlightNumber>

        // physicalFlight.customers.customer.airlinePersons.airlinePerson.personOrgID
        const persons: any[] = Array.isArray(physicalFlight.customers.customer.airlinePersons.airlinePerson)
          ? physicalFlight.customers.customer.airlinePersons.airlinePerson
          : [physicalFlight.customers.customer.airlinePersons.airlinePerson];
        request.passengers.forEach((passenger) => {
          const airlinePerson = persons.find(
            (person) =>
              new Date(person.DOB).toISOString().split('T')[0] == new Date(passenger.DOB).toISOString().split('T')[0] &&
              String(person.firstName).replace(/\s/g, '').toLowerCase() ==
                String(passenger.firstName).replace(/\s/g, '').toLowerCase() &&
              String(person.lastName).replace(/\s/g, '').toLowerCase() ==
                String(passenger.lastName).replace(/\s/g, '').toLowerCase()
          );

          return payload.push({
            'rad1:ApisInformation': {
              'rad1:ApisInfoIndex': '-1',
              'rad1:RecordNumber': airlinePerson?.recordNumber,
              'rad1:LastName': passenger.lastName,
              'rad1:FirstName': passenger.firstName,
              'rad1:MiddleName': passenger.middleName,
              'rad1:BirthDate': passenger.DOB,
              'rad1:Gender': this.mapRadixxGender(passenger.gender),
              'rad1:Citizenship': passenger.nationality.toUpperCase(),
              'rad1:ResidenceCountry': passenger.address.country.toUpperCase(),
              // 'rad1:BirthCountry': passenger.nationality.toUpperCase(),
              'rad1:DocumentType1': 1,
              'rad1:DocumentNumber': passenger.passport,
              'rad1:IssueCountry1': passenger.issueCountry.toUpperCase(),
              'rad1:ExpirationDate1': passenger.datePasaporte,
              'rad1:PhysicalFlightId': physicalFlight['physicalFlightID'],
              'rad1:ActualDepartureDate': physicalFlight['departureDate'],
              'rad1:FlightNumber': physicalFlight['flightNumber'],
              'rad1:DocumentScanned1': 0,
              'rad1:DocumentScanned2': 0,
            },
          });
        });
      });
    });

    return payload;
  }

  /*public generatePayloadDataAgency(request: PaymentWithAgencyCreditDto, pnrData: any) {
    const payload = [];
    const flights = this.forceArray(pnrData.airlines.airline.logicalFlight.logicalFlight);
    flights.map((flight) => {
      const physicalFlights = this.forceArray(flight.physicalFlights.physicalFlight);
      physicalFlights.forEach((physicalFlight) => {
        // departureDate, physicalFlightID, logicalFlightID, flightNumber
        // <rad1: PhysicalFlightId > 276320 < /rad1:PhysicalFlightId>
        //   < rad1: ActualDepartureDate > 2023-05-26 < /rad1:ActualDepartureDate>
        //     < rad1: FlightNumber > 827 < /rad1:FlightNumber>

        // physicalFlight.customers.customer.airlinePersons.airlinePerson.personOrgID
        const persons: any[] = Array.isArray(physicalFlight.customers.customer.airlinePersons.airlinePerson)
          ? physicalFlight.customers.customer.airlinePersons.airlinePerson
          : [physicalFlight.customers.customer.airlinePersons.airlinePerson];
        request.passengers.forEach((passenger) => {
          const airlinePerson = persons.find(
            (person) =>
              new Date(person.DOB).toISOString().split('T')[0] == new Date(passenger.DOB).toISOString().split('T')[0] &&
              String(person.firstName).replace(/\s/g, '').toLowerCase() ==
                String(passenger.firstName).replace(/\s/g, '').toLowerCase() &&
              String(person.lastName).replace(/\s/g, '').toLowerCase() ==
                String(passenger.lastName).replace(/\s/g, '').toLowerCase()
          );

          return payload.push({
            'rad1:ApisInformation': {
              'rad1:ApisInfoIndex': '-1',
              'rad1:RecordNumber': airlinePerson?.recordNumber,
              'rad1:LastName': passenger.lastName,
              'rad1:FirstName': passenger.firstName,
              'rad1:MiddleName': passenger.middleName,
              'rad1:BirthDate': passenger.DOB,
              'rad1:Gender': this.mapRadixxGender(passenger.gender),
              'rad1:Citizenship': passenger.nationality.toUpperCase(),
              'rad1:ResidenceCountry': passenger.address.country.toUpperCase(),
              // 'rad1:BirthCountry': passenger.nationality.toUpperCase(),
              'rad1:DocumentType1': 1,
              'rad1:DocumentNumber': passenger.passport,
              'rad1:IssueCountry1': passenger.issueCountry.toUpperCase(),
              'rad1:ExpirationDate1': passenger.datePasaporte,
              'rad1:PhysicalFlightId': physicalFlight['physicalFlightID'],
              'rad1:ActualDepartureDate': physicalFlight['departureDate'],
              'rad1:FlightNumber': physicalFlight['flightNumber'],
              'rad1:DocumentScanned1': 0,
              'rad1:DocumentScanned2': 0,
            },
          });
        });
      });
    });

    return payload;
  }*/
}
