import axios from 'axios';
import * as moment from 'moment';
import { JsonLogger } from 'src/utils/json-logger';
import { Parser } from 'src/utils/json-xml.parser';
import { Formatter } from 'src/utils/xml.formatter';
import { axiosInstance } from 'src/interceptors/axios.interceptor';
export class NotificationRemoteRepository {
  private logger = new JsonLogger(NotificationRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType) {
    this.logger.log(`[LOG INFO BEFORE ${actionType}] `);
    const xmlResponse = await axiosInstance.post(url, args, headers);

    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    return jsonResponse;
  }

  public async sendNotification({
    reservationEmail,
    confirmationNumber,
    token,
  }: {
    confirmationNumber: string;
    reservationEmail: string;
    token: string;
  }) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Notification.svc`;

    const payload = {
      'tem:SendNotification': {
        'tem:sendNotificationRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ActionType': 'SendReceiptToSpecifiedEmailAddress',
          'rad1:LanguageCode': 'en-us',
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': '299',
            'rad:ConfirmationNumber': confirmationNumber,
          },
          'rad1:ReceiptRequest': {
            'rad1:EmailAddresses': {
              'rad1:EmailAddress': {
                'rad1:Email': reservationEmail,
              },
            },
          },
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Notification/SendNotification',
      },
    };

    try {
      const args = Formatter.convertJSONToSoapRequestCustomSchemas(
        payload,
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Notification.Request"'
      );
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'SendNotification');
      return jsonResponse;
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }
}
