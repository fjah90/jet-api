import { Formatter } from '../utils/xml.formatter';
import { Parser } from '../utils/json-xml.parser';
import { JsonLogger } from 'src/utils/json-logger';
import { axiosInstance } from 'src/interceptors/axios.interceptor';

export class FlightsRemoteRepository {
  private logger = new JsonLogger(FlightsRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType, user) {
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO AFTER ${actionType}] ${JSON.stringify(jsonResponse)} `);
    return jsonResponse;
  }
  public async getAllFlights(token: string, lang: string, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Flight.svc`;
    const payload = {
      'tem:RetrieveAirportRoutes': {
        'tem:RetrieveAirportRoutesRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:LanguageCode': lang.split('-')[0],
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Flight/RetrieveAirportRoutes',
      },
    };
    const args = Formatter.convertJSONToSoapRequest(payload, 'Flight');
    return await this.axiosClient(args, url, headers, 'GET FLIGHTS', user);
  }
}
