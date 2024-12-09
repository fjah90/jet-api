import axios from 'axios';
import { JsonLogger } from 'src/utils/json-logger';
import { Parser } from '../utils/json-xml.parser';
import { axiosInstance } from 'src/interceptors/axios.interceptor';

export class PaymentRemoteRepository {
  private logger = new JsonLogger(PaymentRemoteRepository.name);
  public async getCheckoutUrl(orderCode, orderDescription, orderCurrencyCode, orderValue) {
    this.logger.log(
      JSON.stringify({
        message: 'Starting getCheckoutUrl',
        orderCode,
        orderDescription,
        orderCurrencyCode,
        orderValue,
      })
    );
    const url = `https://secure-test.worldpay.com/jsp/merchant/xml/paymentService.jsp`;

    const payload = {
      submit: [
        {
          name: 'order',
          attrs: {
            orderCode: orderCode,
          },
          children: [
            { description: orderDescription },
            { name: 'amount', attrs: { currencyCode: orderCurrencyCode, exponent: '2', value: orderValue } },
            {
              name: 'paymentMethodMask',
              children: [
                {
                  name: 'include',
                  attrs: { code: 'ALL' },
                },
              ],
            },
          ],
        },
      ],
    };

    const headers = {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        Authorization: 'Basic SFc4RDdTQU5TQ1hPTEdRTFVEWjk6NUslUSo4QkYzR1FOIWJyUDlzUm5qbU5DNA==',
      },
    };
    try {
      const args = this.convertJSONToSoapRequest(payload);
      this.logger.log(
        JSON.stringify({
          message: 'Preparing getCheckoutUrl',
          args,
        })
      );
      const xmlResponse = await axiosInstance.post(url, args, headers);
      const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
      this.logger.log(
        JSON.stringify({
          message: 'Recieved response getCheckoutUrl',
          jsonResponse,
        })
      );
      return jsonResponse;
    } catch (error) {
      this.logger.log(
        JSON.stringify({
          message: 'ERROR in getCheckoutUrl',
          error,
        })
      );
      throw new Error(JSON.stringify(error));
    }
  }

  private convertJSONToSoapRequest(jsonArguments) {
    const soapBody = Parser.parseJSONBodyToXML(jsonArguments);

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE paymentService PUBLIC "-//Worldpay//DTD Worldpay PaymentService v1//EN" "http://dtd.worldpay.com/paymentService_v1.dtd">
<paymentService version="1.4" merchantCode="EVELOPMOBILE">\
          ${soapBody}\
        </paymentService>`;
  }
}
