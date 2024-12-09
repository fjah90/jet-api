import { Formatter } from '../utils/xml.formatter';
import { Parser } from '../utils/json-xml.parser';
import { RetrieveSecurityTokenDto } from './dto/retrieve-security-token.dto';
import { ValidateSecurityTokenDto } from './dto/validate-security-token.dto';
import { AgencySignInDto } from './dto/agency-sign-in.dto';
import { parseString } from 'xml2js';
import { ErrorHelper } from 'src/helper/error.helper';
import { AxiosClient } from 'src/helper/axios.helper';

export class Auth_AgencyRemoteRepository {
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
    const args = Formatter.convertJSONToSoapRequest(payload, 'Security');
    const xmlResponse: any = await AxiosClient.Post(args, url, headers, 'RETRIEVE SECURITY TOKEN');
    await ErrorHelper.Search(xmlResponse.data);
    const jsonResponse = await Parser.convertXMLToJSON(xmlResponse);
    return jsonResponse['s:Body']['RetrieveSecurityTokenResponse']['RetrieveSecurityTokenResult']['a:SecurityToken'];
  }

  public async loginTravelAgent(token: string, { username, password, IATA }: AgencySignInDto) {
    // Construir el cuerpo XML de la solicitud
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.travelAgents.svc`;
    const xmlBody = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" 
          xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.TravelAgents.Request" 
          xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request"> 
          <soapenv:Header/>
          <soapenv:Body>
          <tem:LoginTravelAgent>
          <tem:LoginTravelAgentRequest>
          <rad:SecurityGUID>${token}</rad:SecurityGUID>
          <rad:CarrierCodes>
          <rad:CarrierCode>
          <rad:AccessibleCarrierCode>?</rad:AccessibleCarrierCode>
          </rad:CarrierCode>
          </rad:CarrierCodes>
          <rad1:IATANumber>${IATA}</rad1:IATANumber>
          <rad1:UserName>${username}</rad1:UserName>
          <rad1:Password>${password}</rad1:Password>
          </tem:LoginTravelAgentRequest>
          </tem:LoginTravelAgent>
          </soapenv:Body>
          </soapenv:Envelope>
    `;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_TravelAgents/LoginTravelAgent';
    const response = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    await ErrorHelper.Search(response.data);
    let loggedIn = false;
    parseString(response.data, (err, result) => {
      if (err) {
        throw new Error(`Error parsing XML response: ${err.message}`);
      }
      loggedIn =
        result['s:Envelope']['s:Body'][0]['LoginTravelAgentResponse'][0]['LoginTravelAgentResult'][0][
          'a:LoggedIn'
        ][0] === 'true';
    });

    return loggedIn;
  }

  public async validateSecurityToken({ token }: ValidateSecurityTokenDto) {
    if (!token) return false;
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Security.svc`;
    const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
        xmlns:tem="http://tempuri.org/" 
        xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" 
        xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Security.Request">
      <soapenv:Header/>
      <soapenv:Body><tem:ValidateSecurityToken>
            <tem:ValidateSecurityTokenRequest>
                <rad:CarrierCodes>
                  <rad:CarrierCode>
                      <rad:AccessibleCarrierCode>?</rad:AccessibleCarrierCode>
                  </rad:CarrierCode>
                </rad:CarrierCodes>
                <rad1:SecurityToken>${token}</rad1:SecurityToken>
            </tem:ValidateSecurityTokenRequest>
          </tem:ValidateSecurityToken>
      </soapenv:Body>
    </soapenv:Envelope>
    `;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_Security/ValidateSecurityToken';
    const xmlResponse: any = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    await ErrorHelper.Search(xmlResponse.data);
    const jsonResponse = await Parser.convertXMLToJSON(xmlResponse);
    return await jsonResponse['s:Body']['ValidateSecurityTokenResponse']['ValidateSecurityTokenResult'][
      'a:ValidationResult'
    ];
  }

  public async forgottenUserPassword(token, email, username) {
    if (!token) return false;
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Users.svc`;
    const xmlBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
    xmlns:tem="http://tempuri.org/" 
    xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" 
    xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Users.Security.Request" 
    xmlns:rad2="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Users.Request">
    <soapenv:Header/>
    <soapenv:Body>
          <tem:ForgottenUserPassword>
              <!--Optional:-->
              <tem:ForgottenUserPasswordRequest>
                <rad:SecurityGUID>${token}</rad:SecurityGUID>
                <rad:CarrierCodes>
                    <!--Zero or more repetitions:-->
                    <rad:CarrierCode>
                      <rad:AccessibleCarrierCode>?</rad:AccessibleCarrierCode>
                    </rad:CarrierCode>
                </rad:CarrierCodes>
                <rad1:LanguageCode>en</rad1:LanguageCode>
                <rad1:EmailAddressInfo>
                    <rad2:EmailAddress>${email}</rad2:EmailAddress>
                </rad1:EmailAddressInfo>
                <rad1:UserNameInfo>
                    <rad2:UserName>${username}</rad2:UserName>
                </rad1:UserNameInfo>
              </tem:ForgottenUserPasswordRequest>
          </tem:ForgottenUserPassword>
        </soapenv:Body>
    </soapenv:Envelope>`;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_Users/ForgottenUserPassword';
    const xmlResponse: any = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    await ErrorHelper.Search(xmlResponse.data);
    const jsonResponse = await Parser.convertXMLToJSON(xmlResponse);
    return await jsonResponse['s:Body']['ForgottenUserPassword']['ForgottenUserPasswordResult']['a:ActionSuccessful'];
  }
}
