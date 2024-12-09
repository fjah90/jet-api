import { Formatter } from '../utils/xml.formatter';
import { Parser } from '../utils/json-xml.parser';
import { JsonLogger } from 'src/utils/json-logger';
import { formatPassegner } from './utils/formatter';
import { axiosInstance } from 'src/interceptors/axios.interceptor';

export class ReservationRemoteRepository {
  private logger = new JsonLogger(ReservationRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType, user) {
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO AFTER ${actionType}] ${JSON.stringify(jsonResponse)} `);
    return jsonResponse;
  }
  public async retrievePnr({ token, confirmationNumber }, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Reservation.svc`;
    const payload = {
      'tem:RetrievePNR': {
        'tem:RetrievePnrRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ActionType': 'GetReservation',
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': 299,
            'rad:ConfirmationNumber': confirmationNumber,
          },
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Reservation/RetrievePNR',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Reservation');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'RETRIEVE PNR', user);
      return jsonResponse;
    } catch (error) {
      this.logger.error('Failed retrieve: ' + JSON.stringify(error.message));
    }
  }

  public async retrieveAARQuote(
    {
      token,
      airportCode,
      currency,
      departureDate,
      destinationAirportCode,
      logicalFlightID,
      passengers,
      fareBasisCode,
      fareClassCode,
    },
    user: string
  ) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Pricing.svc`;
    const payload = {
      'tem:RetrieveAARQuote': {
        'tem:RetrieveAARQuoteRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:AARQuotes': {
            'rad1:AARQuote': {
              'rad1:AARRequestPtcs': formatPassegner(passengers),
              'rad1:AirportCode': airportCode,
              'rad1:Currency': currency,
              'rad1:DepartureDate': departureDate,
              'rad1:DestinationAirportCode': destinationAirportCode,
              'rad1:FareBasisCode': fareBasisCode,
              'rad1:FareClass': fareClassCode,
              'rad1:LogicalFlightID': logicalFlightID,
              'rad1:ServiceTypes': [1, 2, 3, 4, 5, 6].map((arr) => {
                return { 'arr:int': arr };
              }),
            },
          },
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Pricing/RetrieveAARQuote',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Pricing', 'Service');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'RETRIEVE AARQUOTE', user);
      return jsonResponse;
    } catch (error) {
      this.logger.error('Failed retrieveAARQuote: ' + JSON.stringify(error.message));
    }
  }
}
