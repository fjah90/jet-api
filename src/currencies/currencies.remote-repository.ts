import { Parser } from '../utils/json-xml.parser';
import { Formatter } from '../utils/xml.formatter';
import axios from 'axios';
import { AvailableCurrencies } from './interfaces/currencies-enum';
import { CurrencySymbols } from 'src/prismic/utils/currencies';
import { JsonLogger } from 'src/utils/json-logger';
import { axiosInstance } from 'src/interceptors/axios.interceptor';

export class CurrenciesRemoteRepository {
  private logger = new JsonLogger(CurrenciesRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType) {
   //this.logger.log(`[LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);

    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    return jsonResponse;
  }
  public async convertCurrencies({ currencyToConvertFrom, currencyToConvertTo, amountToConvert, token }) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Fulfillment.svc`;
    const payload = {
      'tem:ConvertCurrencies': {
        'tem:ConvertCurrenciesRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:CurrencyConversions': {
            'rad1:CurrencyConversion': {
              'rad1:CurrencyToConvertFrom': currencyToConvertFrom,
              'rad1:CurrencyToConvertTo': currencyToConvertTo,
              'rad1:AmountToConvert': amountToConvert,
            },
          },
        },
      },
    };
    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Fulfillment/ConvertCurrencies',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Fulfillment');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'CURRENCIES');
      return jsonResponse;
    } catch (err) {
      throw new Error(JSON.stringify(err));
    }
  }

  public async availableCurrencies() {
    const availableCurrencies = Object.values(AvailableCurrencies);
    return availableCurrencies.map((availableCurrencie) => {
      return {
        currency: availableCurrencie,
        sign: CurrencySymbols[availableCurrencie],
      };
    });
  }
}
