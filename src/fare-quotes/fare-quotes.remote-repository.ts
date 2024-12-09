import { Parser } from '../utils/json-xml.parser';
import { Formatter } from '../utils/xml.formatter';
import { FareQuoteDto } from './dto/fare-quote.dto';
import { GetTouristInfoDto } from 'src/prismic/dto';
import { JsonLogger } from 'src/utils/json-logger';
import { axiosInstance } from 'src/interceptors/axios.interceptor';
import { FareQuotePublicDto } from './dto/fare-quote-publi.dto';
import { AxiosClient } from 'src/helper/axios.helper';

export class FareQuotesRemoteRepository {
  private logger = new JsonLogger(FareQuotesRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType, user) {
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO AFTER ${actionType}] ${JSON.stringify(jsonResponse)} `);
    return jsonResponse;
  }
  public async getFareQuoteRemote(fareQuoteDto: FareQuoteDto, token: string, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Pricing.svc`;
    const payload = {
      'tem:RetrieveFareQuote': {
        'tem:RetrieveFareQuoteRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:CurrencyOfFareQuote': fareQuoteDto.currencyCode,
          'rad1:PromotionalCode': fareQuoteDto.promotionalCode,
          'rad1:IataNumberOfRequestor': '',
          'rad1:CorporationID': '0',
          'rad1:FareFilterMethod': 'NoCombinabilityAllFares',
          'rad1:FareGroupMethod': 'FareClassFareBasis',
          'rad1:InventoryFilterMethod': 'Available',
          'rad1:FareQuoteDetails': fareQuoteDto.fares.map((fare) => fare.toXml()),
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Pricing/RetrieveFareQuote',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Pricing', 'FareQuote');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'GET FARE QUOTE', user);
      return jsonResponse;
    } catch (error) {
      console.log(error);
    }
  }

  public async getFareQuoteDateRangeRemote(fareQuoteDto: FareQuoteDto, token: string, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Pricing.svc`;
    const payload = {
      'tem:RetrieveFareQuoteDateRange': {
        'tem:RetrieveFareQuoteDateRangeRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:CurrencyOfFareQuote': fareQuoteDto.currencyCode,
          'rad1:PromotionalCode': fareQuoteDto.promotionalCode,
          'rad1:IataNumberOfRequestor': '',
          'rad1:CorporationID': '0',
          'rad1:FareFilterMethod': 'NoCombinabilityAllFares',
          'rad1:FareGroupMethod': 'WebFareTypes',
          'rad1:InventoryFilterMethod': 'Available',
          'rad1:FareQuoteDetails': fareQuoteDto.fares.map((fare) => fare.toXml()),
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Pricing/RetrieveFareQuoteDateRange',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Pricing', 'FareQuote');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'GET FARE QUOTE DATE RANGE', user);
      console.log('getFareQuoteDateRangeRemote');
      console.log(jsonResponse);
      return jsonResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getServiceQuote(
    { logicalFlightID, departureDate, airportCode, currency }: GetTouristInfoDto,
    token: string,
    user: string
  ) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Pricing.svc`;
    const payload = {
      'tem:RetrieveServiceQuote': {
        'tem:RetrieveServiceQuoteRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:LogicalFlightID': logicalFlightID,
          'rad1:DepartureDate': departureDate,
          'rad1:AirportCode': airportCode,
          'rad1:ServiceCode': '',
          'rad1:Cabin': '',
          'rad1:Category': '',
          'rad1:Currency': currency,
          'rad1:UTCOffset': '5',
          'rad1:OperatingCarrierCode': '',
          'rad1:MarketingCarrierCode': '',
          'rad1:FareClass': '',
          'rad1:FareBasisCode': '',
          'rad1:ReservationChannel': 'MOBILE',
          'rad1:ServiceTypes': {},
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Pricing/RetrieveServiceQuote',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Pricing', 'Service');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'GET SERVICE QUOTE', user);
      return jsonResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getServiceBundleDetails(serviceBundleCode: string, token: string, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Pricing.svc`;
    const payload = {
      'tem:RetrieveServiceBundleDetails': {
        'tem:RetrieveServiceBundleRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ServiceBundleCode': serviceBundleCode,
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Pricing/RetrieveServiceBundleDetails',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Pricing', '');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'GET SERVICE BUNDLE', user);
      return jsonResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getFareBundleDetails(bundleCode: string, token: string, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Pricing.svc`;
    const payload = {
      'tem:RetrieveFareBundleDetails': {
        'tem:RetrieveFareBundleRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:BundleCode': bundleCode,
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Pricing/RetrieveFareBundleDetails',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Pricing', 'FareBundleDetails');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'GET FARE BUNDLE', user);
      return jsonResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getFareQuotePublicRemote(fareQuoteDto: FareQuotePublicDto, token: string, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Pricing.svc`;
    const xmlBody = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Pricing.Request.FareQuote">
    <soapenv:Header/>
    <soapenv:Body>
       <tem:RetrieveFareQuote>
          <!--Optional:-->
          <tem:RetrieveFareQuoteRequest>
             <rad:SecurityGUID>${token}</rad:SecurityGUID>
             <rad:CarrierCodes>
                <!--Zero or more repetitions:-->
                <rad:CarrierCode>
                   <rad:AccessibleCarrierCode>?</rad:AccessibleCarrierCode>
                </rad:CarrierCode>
             </rad:CarrierCodes>
             <rad1:CurrencyOfFareQuote>${fareQuoteDto.currencyCode}</rad1:CurrencyOfFareQuote>
             <rad1:PromotionalCode>${fareQuoteDto.promotionalCode}</rad1:PromotionalCode>
             <rad1:IataNumberOfRequestor></rad1:IataNumberOfRequestor>
             <rad1:CorporationID>0</rad1:CorporationID>
             <rad1:FareFilterMethod>NoCombinabilityAllFares</rad1:FareFilterMethod>
             <rad1:FareGroupMethod>WebFareTypes</rad1:FareGroupMethod>
             <rad1:InventoryFilterMethod>All</rad1:InventoryFilterMethod>
             <rad1:FareQuoteDetails>
                <rad1:FareQuoteDetail>
                   <rad1:Origin>${fareQuoteDto.originCode}</rad1:Origin>
                   <rad1:Destination>${fareQuoteDto.destinationCode}</rad1:Destination>
                   <rad1:UseAirportsNotMetroGroups>true</rad1:UseAirportsNotMetroGroups>
                   <rad1:UseAirportsNotMetroGroupsAsRule>true</rad1:UseAirportsNotMetroGroupsAsRule>
                   <rad1:UseAirportsNotMetroGroupsForFrom>true</rad1:UseAirportsNotMetroGroupsForFrom>
                   <rad1:UseAirportsNotMetroGroupsForTo>true</rad1:UseAirportsNotMetroGroupsForTo>
                   <rad1:DateOfDeparture>${fareQuoteDto.departureDate}</rad1:DateOfDeparture>
                   <rad1:FareTypeCategory>1</rad1:FareTypeCategory>
                   <rad1:FareClass></rad1:FareClass>
                   <rad1:FareBasisCode></rad1:FareBasisCode>
                   <rad1:Cabin></rad1:Cabin>
                   <rad1:LFID>0</rad1:LFID>
                   <rad1:OperatingCarrierCode></rad1:OperatingCarrierCode>
                   <rad1:MarketingCarrierCode></rad1:MarketingCarrierCode>
                   <rad1:NumberOfDaysBefore>0</rad1:NumberOfDaysBefore>
                   <rad1:NumberOfDaysAfter>360</rad1:NumberOfDaysAfter>
                   <rad1:LanguageCode>${fareQuoteDto.languageCode}</rad1:LanguageCode>
                   <rad1:TicketPackageID></rad1:TicketPackageID>
                   <rad1:FareQuoteRequestInfos>
                      <rad1:FareQuoteRequestInfo>
                         <rad1:PassengerTypeID>1</rad1:PassengerTypeID>
                         <rad1:TotalSeatsRequired>1</rad1:TotalSeatsRequired>
                      </rad1:FareQuoteRequestInfo>
                   </rad1:FareQuoteRequestInfos>
                </rad1:FareQuoteDetail>
                <rad1:FareQuoteDetail>
                   <rad1:Origin>${fareQuoteDto.originCode}</rad1:Origin>
                   <rad1:Destination>${fareQuoteDto.destinationCode}</rad1:Destination>
                   <rad1:UseAirportsNotMetroGroups>false</rad1:UseAirportsNotMetroGroups>
                   <rad1:UseAirportsNotMetroGroupsAsRule>false</rad1:UseAirportsNotMetroGroupsAsRule>
                   <rad1:UseAirportsNotMetroGroupsForFrom>false</rad1:UseAirportsNotMetroGroupsForFrom>
                   <rad1:UseAirportsNotMetroGroupsForTo>false</rad1:UseAirportsNotMetroGroupsForTo>
                   <rad1:DateOfDeparture>${fareQuoteDto.departureDate}</rad1:DateOfDeparture>
                   <rad1:FareTypeCategory>1</rad1:FareTypeCategory>
                   <rad1:FareClass></rad1:FareClass>
                   <rad1:FareBasisCode></rad1:FareBasisCode>
                   <rad1:Cabin></rad1:Cabin>
                   <rad1:LFID>0</rad1:LFID>
                   <rad1:OperatingCarrierCode></rad1:OperatingCarrierCode>
                   <rad1:MarketingCarrierCode></rad1:MarketingCarrierCode>
                   <rad1:NumberOfDaysBefore>0</rad1:NumberOfDaysBefore>
                   <rad1:NumberOfDaysAfter>360</rad1:NumberOfDaysAfter>
                   <rad1:LanguageCode>${fareQuoteDto.languageCode}</rad1:LanguageCode>
                   <rad1:TicketPackageID>1</rad1:TicketPackageID>
                   <rad1:FareQuoteRequestInfos>
                      <rad1:FareQuoteRequestInfo>
                         <rad1:PassengerTypeID>1</rad1:PassengerTypeID>
                         <rad1:TotalSeatsRequired>1</rad1:TotalSeatsRequired>
                      </rad1:FareQuoteRequestInfo>
                   </rad1:FareQuoteRequestInfos>
                </rad1:FareQuoteDetail>
             </rad1:FareQuoteDetails>
             <rad1:ProfileId>-1</rad1:ProfileId>
          </tem:RetrieveFareQuoteRequest>
       </tem:RetrieveFareQuote>
    </soapenv:Body>
 </soapenv:Envelope> `;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_Pricing/RetrieveFareQuote';
    const xmlResponse: any = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    // const xml = await FormatterHelper.clearPrefixXML(xmlResponse.data);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    this.logger.log(`user:${user} [LOG INFO AFTER getFareQuotePublicRemote] ${JSON.stringify(jsonResponse)} `);
    return jsonResponse;
  }
}
