import { JsonLogger } from 'src/utils/json-logger';
import { Parser } from 'src/utils/json-xml.parser';
import { ChangePassRequest } from './dto/change-pass.request';
import { Formatter } from 'src/utils/xml.formatter';
import { ModifyAgentDto } from './dto/modify-agent.dto';
import { FormatterHelper } from 'src/helper/formater.helper';
import { AxiosClient } from 'src/helper/axios.helper';
import { ErrorHelper } from 'src/helper/error.helper';

export class AgencyRemoteRepository {
  private logger = new JsonLogger(AgencyRemoteRepository.name);

  public async changePassword(changePassDto: ChangePassRequest) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.users.svc`;
    const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
      xmlns:tem="http://tempuri.org/" 
      xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" 
      xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Users.Security.Request">
      <soapenv:Header/>
      <soapenv:Body>
        <tem:ChangeUserPassword>
            <tem:ChangeUserPasswordRequest>
              <rad:SecurityGUID>${changePassDto.token}</rad:SecurityGUID>
              <rad:CarrierCodes>
                  <rad:CarrierCode>
                    <rad:AccessibleCarrierCode>?</rad:AccessibleCarrierCode>
                  </rad:CarrierCode>
              </rad:CarrierCodes>
              <rad:ClientIPAddress>?</rad:ClientIPAddress>
              <rad1:UserName>${changePassDto.username}</rad1:UserName>
              <rad1:CurrentPassword>${changePassDto.currentpassword}</rad1:CurrentPassword>
              <rad1:NewPassword>${changePassDto.newpassword}</rad1:NewPassword>
            </tem:ChangeUserPasswordRequest>
        </tem:ChangeUserPassword>
      </soapenv:Body>
    </soapenv:Envelope>
    `;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_Users/ChangeUserPassword';
    const xmlResponse: any = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    await ErrorHelper.Search(xmlResponse.data);
    const xml = await FormatterHelper.clearPrefixXML(xmlResponse.data);
    const jsonResponse = await Parser.convertXMLToJSONRaw(xml);
    const resultCode = jsonResponse['s:Body']['ChangeUserPasswordResponse']['ChangeUserPasswordResult']['ResultCode'];
    const resultMessage = jsonResponse['s:Body']['ChangeUserPasswordResponse']['ChangeUserPasswordResult']['ResultMessage'];

    return { ResultCode: resultCode, ResultMessage: resultMessage };
  }

  public async viewCredit(Token: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.travelAgents.svc`;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_TravelAgents/RetrieveAvailableAgencyCredit';
    const payload = {
      'tem:RetrieveAvailableAgencyCredit': {
        'tem:RetrieveAvailableAgencyCreditRequest': {
          'rad:SecurityGUID': Token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
        },
      },
    };
    const xmlBody = Formatter.convertJSONToSoapRequest(payload, 'TravelAgents');
    const xmlResponse: any = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    await ErrorHelper.Search(xmlResponse.data);
    const jsonResponse = await Parser.convertXMLToJSON(xmlResponse);
    return jsonResponse['s:Body']['RetrieveAvailableAgencyCreditResponse']['RetrieveAvailableAgencyCreditResult'][
      'a:AvailableCredit'
    ];
  }

  public async update(modifyAgentDto: ModifyAgentDto, actionType: string) {
    const xmlBody = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
      xmlns:tem="http://tempuri.org/" 
      xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request"
      xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.TravelAgents.Request">
        <soapenv:Header/>
        <soapenv:Body>
            <tem:ModifyAgent>
              <tem:ModifyAgentRequest>
                  <rad:SecurityGUID>${modifyAgentDto.token}</rad:SecurityGUID>
                  <rad:CarrierCodes>
                    <rad:CarrierCode>
                        <rad:AccessibleCarrierCode>?</rad:AccessibleCarrierCode>
                    </rad:CarrierCode>
                  </rad:CarrierCodes>
                  <rad1:ActionType>${actionType}</rad1:ActionType>
                  <rad1:IATANumber>${modifyAgentDto.IATA}</rad1:IATANumber>
                  <rad1:AgentUsername>${modifyAgentDto.AgentUserName}</rad1:AgentUsername>
                  <rad1:AgentFirstName>${modifyAgentDto.AgentFirstName}</rad1:AgentFirstName>
                  <rad1:AgentLastName>${modifyAgentDto.AgentLastName}</rad1:AgentLastName>
                  <rad1:AgentAddress1>${modifyAgentDto.AgentAdress1}</rad1:AgentAddress1>
                  <rad1:AgentAddress2>${modifyAgentDto.AgentAdress2}</rad1:AgentAddress2>
                  <rad1:AgentCity>${modifyAgentDto.AgentCity}</rad1:AgentCity>
                  <rad1:AgentState>${modifyAgentDto.AgentState}</rad1:AgentState>
                  <rad1:AgentPostalCode>${modifyAgentDto.AgentPostalCode}</rad1:AgentPostalCode>
                  <rad1:AgencyCountry>${modifyAgentDto.AgentCountry}</rad1:AgencyCountry>
                  <rad1:AgentEmail>${modifyAgentDto.AgentEmail}</rad1:AgentEmail>
              </tem:ModifyAgentRequest>
            </tem:ModifyAgent>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.travelAgents.svc`;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_TravelAgents/ModifyAgent';
    const xmlResponse: any = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    await ErrorHelper.Search(xmlResponse.data);
    const jsonResponse = await Parser.convertXMLToJSON(xmlResponse);
    return jsonResponse['s:Body']['ModifyAgentResponse']['ModifyAgentResult']['a:ActionSuccessful'];
  }

  public async getAgentsList(Token: string, IATA: string) {
    const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
      xmlns:tem="http://tempuri.org/" 
      xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" 
      xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.TravelAgents.Request">
      <soapenv:Header/>
      <soapenv:Body>
          <tem:RetrieveAgentList>
            <tem:retrieveAgentListRequest>
                <rad:SecurityGUID>${Token}</rad:SecurityGUID>
                <rad:CarrierCodes>
                  <rad:CarrierCode>
                      <rad:AccessibleCarrierCode>?</rad:AccessibleCarrierCode>
                  </rad:CarrierCode>
                </rad:CarrierCodes>
                <rad1:IATANumber>${IATA}</rad1:IATANumber>
            </tem:retrieveAgentListRequest>
          </tem:RetrieveAgentList>
      </soapenv:Body>
    </soapenv:Envelope>
    `;

    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.TravelAgents.svc`;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_TravelAgents/RetrieveAgentList';
    const xmlResponse: any = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    await ErrorHelper.Search(xmlResponse.data);
    const xml = await FormatterHelper.clearPrefixXML(xmlResponse.data);
    const jsonResponse = await Parser.convertXMLToJSONRaw(xml);
    return jsonResponse['s:Body']['RetrieveAgentListResponse']['RetrieveAgentListResult']['ViewAgents'];
  }

  public async getAgent(Token: string, UserId: string, IATA: string) {
    const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
      xmlns:tem="http://tempuri.org/" 
      xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" 
      xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.TravelAgents.Request">
      <soapenv:Header/>
      <soapenv:Body>
          <tem:RetrieveAgentDetails>
            <tem:retrieveAgentDetailsRequest>
                <rad:SecurityGUID>${Token}</rad:SecurityGUID>
                <rad:CarrierCodes>
                  <rad:CarrierCode>
                      <rad:AccessibleCarrierCode>?</rad:AccessibleCarrierCode>
                  </rad:CarrierCode>
                </rad:CarrierCodes>
                <rad1:IATANumber>${IATA}</rad1:IATANumber>
                <rad1:UserId>${UserId}</rad1:UserId>
            </tem:retrieveAgentDetailsRequest>
          </tem:RetrieveAgentDetails>
      </soapenv:Body>
    </soapenv:Envelope>
    `;
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.TravelAgents.svc`;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_TravelAgents/RetrieveAgentDetails';
    const xmlResponse: any = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    await ErrorHelper.Search(xmlResponse.data);
    const xml = await FormatterHelper.clearPrefixXML(xmlResponse.data);
    const jsonResponse = await Parser.convertXMLToJSONRaw(xml);
    console.log(jsonResponse);
    return jsonResponse['s:Body']['RetrieveAgentDetailsResponse']['RetrieveAgentDetailsResult']['ViewAgentDetails'];
  }
}
