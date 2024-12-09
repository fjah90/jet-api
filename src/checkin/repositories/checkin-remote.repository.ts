import { Formatter } from 'src/utils/xml.formatter';
import { Parser } from 'src/utils/json-xml.parser';
import { formatPassegner } from '../utils/formatter';
import { CreateCheckinWihtTokenDto } from '../dto';
import { JsonLogger } from 'src/utils/json-logger';
import { axiosInstance } from 'src/interceptors/axios.interceptor';

export class CheckinRemoteRepository {
  private logger = new JsonLogger(CheckinRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType, user) {
    // if (JSON.parse(process.env.SHOW_SWAGGER)) 
    this.logger.log(`user:${user} [LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    return jsonResponse;
  }
  public async createCheckin(createCheckinDto: CreateCheckinWihtTokenDto, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.CheckIn.svc`;
    const payload = {
      'tem:CheckIn': {
        'tem:CheckInRequest': {
          'rad:SecurityGUID': createCheckinDto.token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad:ClientIPAddress': '',
          'rad:HistoricUserName': '',
          'rad1:ActionType': 'CheckIn',
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': 299,
            'rad:ConfirmationNumber': createCheckinDto.confirmationNumber,
          },
          'rad1:CheckInDetails': formatPassegner(createCheckinDto),
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_CheckIn/CheckIn',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'CheckIn');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'CHECKIN', user);
      return jsonResponse;
    } catch (error) {
      console.log(error);
    }
  }
}
