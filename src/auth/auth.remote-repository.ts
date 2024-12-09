import axios from 'axios';
import { Formatter } from '../utils/xml.formatter';
import { Parser } from '../utils/json-xml.parser';
import { RetrieveSecurityTokenDto } from './dto/retrieve-security-token.dto';
import { ValidateSecurityTokenDto } from './dto/validate-security-token.dto';
import { JsonLogger } from 'src/utils/json-logger';
import { axiosInstance } from 'src/interceptors/axios.interceptor';

export class AuthRemoteRepository {
  private logger = new JsonLogger(AuthRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType) {
    this.logger.log(`[LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    return jsonResponse;
  }
  public async retrieveSecurityToken({ username, password }: RetrieveSecurityTokenDto) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Security.svc`;
    const payload = {
      'tem:RetrieveSecurityToken': {
        'tem:RetrieveSecurityTokenRequest': {
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:LogonID': username,
          'rad1:Password': password,
        },
      },
    };
    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Security/RetrieveSecurityToken',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Security');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'RETRIEVE SECURITY TOKEN');
      return jsonResponse['s:Body']['RetrieveSecurityTokenResponse']['RetrieveSecurityTokenResult']['a:SecurityToken'];
    } catch (err) {
      throw new Error(`[RetrieveToken]:\n${JSON.stringify(err)}`);
    }
  }

  public async validateSecurityToken({ token }: ValidateSecurityTokenDto) {
    if (!token) return false;
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Security.svc`;
    const payload = {
      'tem:ValidateSecurityToken': {
        'tem:ValidateSecurityTokenRequest': {
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:SecurityToken': token,
        },
      },
    };
    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Security/ValidateSecurityToken',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Security');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'VALIDATE SECURITY TOKEN');
      return await JSON.parse(
        jsonResponse['s:Body']['ValidateSecurityTokenResponse']['ValidateSecurityTokenResult']['a:ValidationResult']
      );
    } catch (err) {
      throw new Error(`[ValidateToken]:\n${JSON.stringify(err)}`);
    }
  }
}
