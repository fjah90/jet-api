import * as moment from 'moment';
import { JsonLogger } from 'src/utils/json-logger';
import { Parser } from 'src/utils/json-xml.parser';
import { Formatter } from 'src/utils/xml.formatter';
import { EpgPaymentInputDto } from '../dto/epg-payment-input.dto';
import { axiosInstance } from 'src/interceptors/axios.interceptor';
import { AxiosClient } from 'src/helper/axios.helper';
import { ErrorHelper } from 'src/helper/error.helper';
import { FormatterHelper } from 'src/helper/formater.helper';
import { PaymentWithAgencyCreditDto } from '../dto/credit-payment-input-agency.dto';
import { PaymentStatus } from '../enum/payment-status.enum';
export class PaymentRemoteRepository {
  private logger = new JsonLogger(PaymentRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType, user) {
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO AFTER ${actionType}] ${JSON.stringify(jsonResponse)} `);
    return jsonResponse;
  }

  public async updateExternalProcessedPayment(
    pnrData: any,
    operationData: any,
    confirmationNumber: string,
    reservationPaymentID: string,
    token: string,
    user: string
  ) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Fulfillment.svc`;

    pnrData.reservationContacts = pnrData?.reservationContacts?.reservationContact
      ? Formatter.forceArray(pnrData.reservationContacts.reservationContact)
      : [];
    const firstPerson = pnrData.reservationContacts.find(
      (reservationContact) => reservationContact.firstName && reservationContact.lastName
    );

    pnrData.contactInfos = pnrData?.contactInfos?.contactInfo
      ? Formatter.forceArray(pnrData?.contactInfos?.contactInfo)
      : [];

    let paymentStatus = 'DECLINED';

    if (operationData['status'] == 'SUCCESS_WARNING' || operationData['status'] == 'SUCCESS') {
      paymentStatus = 'APPROVED';
    }

    if (operationData['status'] == 'FAIL' || operationData['status'] == 'ERROR') {
      paymentStatus = 'DECLINED';
    }

    const payload = {
      'tem:UpdateExternalProcessedPaymentDetails': {
        'tem:UpdateExternalProcessedPaymentDetailsRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': '299',
            'rad:ConfirmationNumber': confirmationNumber,
          },
          'rad1:UpdatePayments': {
            'rad1:AuthorizationCode': 123,
            'rad1:CVCode': '',
            'rad1:CardCurrency': operationData['currency'],
            'rad1:CardHolder': `${firstPerson?.firstName} ${firstPerson?.lastName}`,
            'rad1:CardNumber': operationData['paymentDetails']['cardNumber'],
            'rad1:CurrencyPaid': operationData['currency'],
            'rad1:DatePaid': moment().format('YYYY-MM-DD'),
            'rad1:ExpirationDate': moment().format('YYYY-MM-DD'),
            'rad1:MerchantID': '123',
            'rad1:PaymentAmount': operationData['amount'],
            'rad1:PaymentMethod': 'VISA',
            'rad:PaymentReference': `${confirmationNumber}:${reservationPaymentID}`,
            'rad1:ProcessorID': '',
            'rad1:ProcessorName': 'EPG',
            'rad1:Reference': `${confirmationNumber}:${reservationPaymentID}`,
            'rad1:ResPaymentId': reservationPaymentID,
            'rad1:ResponseCode': '',
            'rad1:ResponseMessage': '123',
            'rad1:Result': '',
            'rad1:TransactionID': '',
            'rad1:TransactionStatus': paymentStatus,
          },
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Fulfillment/UpdateExternalProcessedPaymentDetails',
      },
    };

    try {
      const args = Formatter.convertJSONToSoapRequestCustomSchemas(
        payload,
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Fulfillment.Request"'
      );
      const jsonResponse: any = await this.axiosClient(
        args,
        url,
        headers,
        'UpdateExternalProcessedPaymentDetails',
        user
      );
      return jsonResponse;
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  public async insertExternalProcessedPayment(
    pnrData: any,
    paymentInput: EpgPaymentInputDto,
    token: string,
    alfaNumericValue: string,
    user: string,
    iata: string,
    paymentStatus: string
  ) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Fulfillment.svc`;
    pnrData.reservationContacts = Formatter.forceArray(pnrData.reservationContacts.reservationContact);
    const firstPerson = pnrData.reservationContacts.find(
      (reservationContact) => reservationContact.firstName && reservationContact.lastName
    );

    pnrData.contactInfos = pnrData?.contactInfos?.contactInfo
      ? Formatter.forceArray(pnrData.contactInfos.contactInfo)
      : [];
    const firstContact = pnrData.contactInfos[0];

    const payor = {
      'rad2:PersonOrgID': firstPerson?.personOrgID,
      'rad2:FirstName': firstPerson?.firstName,
      'rad2:LastName': firstPerson?.lastName,
      'rad2:MiddleName': firstPerson?.middleName,
      'rad2:Age': firstPerson?.age,
      'rad2:DOB': firstPerson?.DOB,
      'rad2:Gender': firstPerson?.gender == 'F' ? 'Female' : 'Male',
      'rad2:Title': firstPerson?.title,
      'rad2:NationalityLaguageID': firstPerson?.nationalityLaguageID,
      'rad2:RelationType': firstPerson?.relationType
        ? firstPerson?.relationType.charAt(0).toUpperCase() + firstPerson?.relationType.slice(1).toLowerCase()
        : 'Self',
      'rad2:WBCID': firstPerson?.WBCID,
      'rad2:PTCID': firstPerson?.PTCID,
      'rad2:PTC': firstPerson?.PTCID,
      'rad2:TravelsWithPersonOrgID': '0',
      'rad2:RedressNumber': '',
      'rad2:KnownTravelerNumber': '',
      'rad2:MarketingOptIn': 'false',
      'rad2:UseInventory': 'false',
      'rad2:Address': {
        'rad2:Address1': firstPerson?.address || '-',
        'rad2:Address2': firstPerson?.address2 || '-',
        'rad2:City': firstPerson?.city || '-',
        'rad2:State': firstPerson?.state || '-',
        'rad2:Postal': '0000',
        'rad2:Country': firstPerson?.country || '-',
        'rad2:CountryCode': '',
        'rad2:AreaCode': '',
        'rad2:PhoneNumber': firstContact?.contactField || '',
        'rad2:Display': '',
      },
      'rad2:Company': '',
      'rad2:Comments': '',
      'rad2:Passport': '',
      'rad2:Nationality': firstPerson?.country,
      'rad2:ProfileId': '0',
      'rad2:IsPrimaryPassenger': true,
      'rad2:ContactInfos': '',
      'rad2:FrequentFlyerNumber': '',
      'rad2:Suffix': '',
      'rad2:Weight': '0',
      'rad2:Height': '0',
    };

    const payload = {
      'tem:InsertExternalProcessedPayment': {
        'tem:ExternalProcessedPaymentRequest': {
          'rad:TransactionInfo': {
            'rad1:SecurityGUID': token,
            'rad1:CarrierCodes': {
              'rad1:CarrierCode': {
                'rad1:AccessibleCarrierCode': '?',
              },
            },
          },
          'rad:ReservationInfo': {
            'rad1:SeriesNumber': 299,
            'rad1:ConfirmationNumber': pnrData.confirmationNumber,
          },
          'rad:ExternalPayments': {
            'rad:InsertExternalProcessedPayment': {
              'rad:BaseAmount': paymentInput.amount,
              'rad:BaseCurrency': paymentInput.currency,
              'rad:CardHolder': `${firstPerson?.firstName} ${firstPerson?.lastName}`,
              'rad:CardNumber': '0000',
              'rad:CheckNumber': 0,
              'rad:CurrencyPaid': paymentInput.currency,
              'rad:CVCode': '',
              'rad:DatePaid': moment().format('YYYY-MM-DD'),
              'rad:DocumentReceivedBy': '',
              'rad:ExpirationDate': moment().add(1, 'days').format('YYYY-MM-DD'),
              'rad:ExchangeRate': 0,
              'rad:ExchangeRateDate': moment().format('YYYY-MM-DD'),
              'rad:FFNumber': '',
              'rad:PaymentComment': '',
              'rad:PaymentAmount': paymentInput.amount,
              'rad:PaymentMethod': paymentInput.paymentMethod ? paymentInput.paymentMethod : 'VISA',
              'rad:PaymentMethodType': paymentInput.paymentMethodType ? paymentInput.paymentMethodType : '',
              'rad:Reference': alfaNumericValue,
              'rad:TerminalID': '2',
              'rad:UserData': '',
              'rad:UserID': '',
              'rad:IataNumber': iata,
              'rad:ValueCode': '',
              'rad:VoucherNumber': paymentInput.merchantTransactionId.split(':')[1],
              'rad:IsTACreditCard': 1,
              'rad:GcxID': '',
              'rad:GcxOptOption': '',
              'rad:OriginalCurrency': paymentInput.currency,
              'rad:OriginalAmount': paymentInput.amount,
              'rad:TransactionStatus': paymentStatus ? paymentStatus : 'NOTYETPROCESSED',
              'rad:AuthorizationCode': paymentInput.authorizationCode ? paymentInput.authorizationCode : '0',
              'rad:PaymentReference': alfaNumericValue,
              'rad:ResponseMessage': '0',
              'rad:CardCurrency': paymentInput.currency,
              'rad:BillingCountry': '',
              'rad:FingerPrintingSessionID': '',
              'rad:Payor': payor,
              'rad:Result': '',
              'rad:TransactionID': '',
              'rad:ResponseCode': '',
              'rad:AncillaryData01': '',
              'rad:AncillaryData02': '',
              'rad:AncillaryData03': '',
              'rad:AncillaryData04': '',
              'rad:AncillaryData05': '',
              'rad:ProcessorID': '',
              'rad:MerchantID': '123',
              'rad:ProcessorName': paymentInput.ProcessorName ? paymentInput.ProcessorName : 'EPG',
              'rad:MetaData': {
                'rad3:PaymentMetaData': {
                  'rad3:KeyName': '',
                  'rad3:Value': '',
                },
              },
            },
          },
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Fulfillment/InsertExternalProcessedPayment',
      },
    };

    try {
      const args = Formatter.convertJSONToSoapRequestCustomSchemas(
        payload,
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Fulfillment.Request" xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" xmlns:rad2="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Reservation.Request" xmlns:rad3="http://schemas.datacontract.org/2004/07/Radixx.Reservation.Base"'
      );
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'InsertExternalPayment', user);
      return jsonResponse;
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  }

  public async ProcessPNRPayment(PaymentWithCreditDto: PaymentWithAgencyCreditDto) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Fulfillment.svc`;
    const xmlBody = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Fulfillment.Request" xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" xmlns:rad2="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Reservation.Request" xmlns:rad3="http://schemas.datacontract.org/2004/07/Radixx.Reservation.Base">
   <soapenv:Header/>
   <soapenv:Body>
      <tem:ProcessPNRPayment>
         <!--Optional:-->
         <tem:PNRPaymentRequest>
            <rad:TransactionInfo>
               <rad1:SecurityGUID>${PaymentWithCreditDto.token}</rad1:SecurityGUID>
               <rad1:CarrierCodes>
                  <!--Zero or more repetitions:-->
                  <rad1:CarrierCode>
                     <rad1:AccessibleCarrierCode>?</rad1:AccessibleCarrierCode>
                  </rad1:CarrierCode>
               </rad1:CarrierCodes>
               <!--Optional:-->
               <rad1:ClientIPAddress>?</rad1:ClientIPAddress>
               <!--Optional:-->
               <rad1:HistoricUserName>?</rad1:HistoricUserName>
            </rad:TransactionInfo>
            <rad:ReservationInfo>
               <rad1:SeriesNumber>${PaymentWithCreditDto.SeriesNumber}</rad1:SeriesNumber>
               <rad1:ConfirmationNumber>${PaymentWithCreditDto.confirmationNumber}</rad1:ConfirmationNumber>
            </rad:ReservationInfo>
            <rad:PNRPayments>
               <!--Zero or more repetitions:-->
                <rad:ProcessPNRPayment>
                  <rad:BaseAmount>${PaymentWithCreditDto.BaseAmount}</rad:BaseAmount>
                  <rad:BaseCurrency>${PaymentWithCreditDto.BaseCurrency}</rad:BaseCurrency>
                  <rad:CardHolder/>
                  <rad:CardNumber/>
                  <rad:CheckNumber>${PaymentWithCreditDto.CheckNumber}</rad:CheckNumber>
                  <rad:CurrencyPaid>${PaymentWithCreditDto.CurrencyPaid}</rad:CurrencyPaid>
                  <rad:CVCode/>
                  <rad:DatePaid>${PaymentWithCreditDto.DatePaid}</rad:DatePaid>
                  <rad:DocumentReceivedBy>9T</rad:DocumentReceivedBy>
                  <rad:ExpirationDate>${PaymentWithCreditDto.ExpirationDate}</rad:ExpirationDate>
                  <rad:ExchangeRate>${PaymentWithCreditDto.ExchangeRate}</rad:ExchangeRate>
                  <rad:ExchangeRateDate>${PaymentWithCreditDto.ExchangeRateDate}</rad:ExchangeRateDate>
                  <rad:FFNumber>11</rad:FFNumber>
                  <rad:PaymentComment>Pay for Reservation ${PaymentWithCreditDto.SeriesNumber}</rad:PaymentComment>
                  <rad:PaymentAmount>${PaymentWithCreditDto.PaymentAmount}</rad:PaymentAmount>
                  <rad:PaymentMethod>INVC</rad:PaymentMethod>
                  <rad:Reference/>
                  <rad:TerminalID>1</rad:TerminalID>
                  <rad:UserData/>
                  <rad:UserID>userId</rad:UserID>
                  <rad:IataNumber>${PaymentWithCreditDto.iata}</rad:IataNumber>
                  <rad:ValueCode/>
                  <rad:VoucherNumber>${PaymentWithCreditDto.VoucherNumber}</rad:VoucherNumber>
                  <rad:IsTACreditCard>false</rad:IsTACreditCard>
                  <rad:GcxID>1</rad:GcxID>
                  <rad:GcxOptOption>1</rad:GcxOptOption>
                  <rad:OriginalCurrency>${PaymentWithCreditDto.OriginalCurrency}</rad:OriginalCurrency>
                  <rad:OriginalAmount>${PaymentWithCreditDto.OriginalAmount}</rad:OriginalAmount>
                  <rad:TransactionStatus>APPROVED</rad:TransactionStatus>
                  <rad:AuthorizationCode/>
                  <rad:PaymentReference/>
                  <rad:ResponseMessage/>
                  <rad:CardCurrency>${PaymentWithCreditDto.OriginalCurrency}</rad:CardCurrency>
                  <rad:BillingCountry>GB</rad:BillingCountry>
                  <rad:FingerPrintingSessionID>1</rad:FingerPrintingSessionID>
                  <rad:Payor>
                    <rad2:PersonOrgID>${PaymentWithCreditDto.Payor.PersonOrgID}</rad2:PersonOrgID>
                    <rad2:FirstName>${PaymentWithCreditDto.Payor.FirstName}</rad2:FirstName>
                    <rad2:LastName>${PaymentWithCreditDto.Payor.LastName}</rad2:LastName>
                    <rad2:MiddleName>${PaymentWithCreditDto.Payor.MiddleName}</rad2:MiddleName>
                    <rad2:Age>${PaymentWithCreditDto.Payor.Age}</rad2:Age>
                    <rad2:DOB>${PaymentWithCreditDto.Payor.DOB}</rad2:DOB>
                    <rad2:Gender>${PaymentWithCreditDto.Payor.Gender}</rad2:Gender>
                    <rad2:Title>${PaymentWithCreditDto.Payor.Title}</rad2:Title>
                    <rad2:NationalityLaguageID>${PaymentWithCreditDto.Payor.NationalityLaguageID}</rad2:NationalityLaguageID>
                    <rad2:RelationType>${PaymentWithCreditDto.Payor.RelationType}</rad2:RelationType>
                    <rad2:WBCID>${PaymentWithCreditDto.Payor.WBCID}</rad2:WBCID>
                    <rad2:PTCID>${PaymentWithCreditDto.Payor.PTCID}</rad2:PTCID>
                    <rad2:PTC>${PaymentWithCreditDto.Payor.PTC}</rad2:PTC>
                    <rad2:TravelsWithPersonOrgID>${PaymentWithCreditDto.Payor.TravelsWithPersonOrgID}</rad2:TravelsWithPersonOrgID>
                    <rad2:RedressNumber>${PaymentWithCreditDto.Payor.RedressNumber}</rad2:RedressNumber>
                    <rad2:KnownTravelerNumber>${PaymentWithCreditDto.Payor.KnownTravelerNumber}</rad2:KnownTravelerNumber>
                    <rad2:MarketingOptIn>${PaymentWithCreditDto.Payor.MarketingOptIn}</rad2:MarketingOptIn>
                    <rad2:UseInventory>${PaymentWithCreditDto.Payor.UseInventory}</rad2:UseInventory>
                    <rad2:Address>
                        <rad2:Address1>${PaymentWithCreditDto.Payor.Address.address1}</rad2:Address1>
                        <rad2:Address2>${PaymentWithCreditDto.Payor.Address.address2}</rad2:Address2>
                        <rad2:City>${PaymentWithCreditDto.Payor.Address.city}</rad2:City>
                        <rad2:State>${PaymentWithCreditDto.Payor.Address.state}</rad2:State>
                        <rad2:Postal>${PaymentWithCreditDto.Payor.Address.postal}</rad2:Postal>
                        <rad2:Country>${PaymentWithCreditDto.Payor.Address.country}</rad2:Country>
                        <rad2:CountryCode>${PaymentWithCreditDto.Payor.Address.countryCode}</rad2:CountryCode>
                        <rad2:AreaCode>${PaymentWithCreditDto.Payor.Address.areaCode}</rad2:AreaCode>
                        <rad2:PhoneNumber>${PaymentWithCreditDto.Payor.Address.phoneNumber}</rad2:PhoneNumber>
                        <rad2:Display>${PaymentWithCreditDto.Payor.Address.display}</rad2:Display>
                    </rad2:Address>
                    <rad2:Company>${PaymentWithCreditDto.Payor.Company}</rad2:Company>
                    <rad2:Comments>${PaymentWithCreditDto.Payor.Comments}</rad2:Comments>
                    <rad2:Passport>${PaymentWithCreditDto.Payor.Passport}</rad2:Passport>
                    <rad2:Nationality>${PaymentWithCreditDto.Payor.Nationality}</rad2:Nationality>
                    <rad2:ProfileId>${PaymentWithCreditDto.Payor.ProfileId}</rad2:ProfileId>
                    <rad2:IsPrimaryPassenger>${PaymentWithCreditDto.Payor.IsPrimaryPassenger}</rad2:IsPrimaryPassenger>
                    <rad2:ContactInfos>
                        <rad2:ContactInfo>
                            <rad2:ContactID>${PaymentWithCreditDto.Payor.ContactInfo.contactID}</rad2:ContactID>
                            <rad2:PersonOrgID>${PaymentWithCreditDto.Payor.ContactInfo.personOrgID}</rad2:PersonOrgID>
                            <rad2:ContactField>${PaymentWithCreditDto.Payor.ContactInfo.contactField}</rad2:ContactField>
                            <rad2:ContactType>${PaymentWithCreditDto.Payor.ContactInfo.contactType}</rad2:ContactType>
                            <rad2:Extension>${PaymentWithCreditDto.Payor.ContactInfo.extension}</rad2:Extension>
                            <rad2:CountryCode>${PaymentWithCreditDto.Payor.ContactInfo.countryCode}</rad2:CountryCode>
                            <rad2:AreaCode>${PaymentWithCreditDto.Payor.ContactInfo.areaCode}</rad2:AreaCode>
                            <rad2:PhoneNumber>${PaymentWithCreditDto.Payor.ContactInfo.phoneNumber}</rad2:PhoneNumber>
                            <rad2:Display>${PaymentWithCreditDto.Payor.ContactInfo.display}</rad2:Display>
                            <rad2:PreferredContactMethod>${PaymentWithCreditDto.Payor.ContactInfo.preferredContactMethod}</rad2:PreferredContactMethod>
                        </rad2:ContactInfo>
                    </rad2:ContactInfos>
              </rad:Payor>
              </rad:ProcessPNRPayment>
            </rad:PNRPayments>
            <!--Optional:-->
            <rad:ActionType>ProcessPNRPayment</rad:ActionType>
         </tem:PNRPaymentRequest>
      </tem:ProcessPNRPayment>
   </soapenv:Body>
</soapenv:Envelope>
    `;
    const SOAPAction = 'http://tempuri.org/IConnectPoint_Fulfillment/ProcessPNRPayment';
    const xmlResponse: any = await AxiosClient.DirectPost(url, xmlBody, SOAPAction);
    // const xml = await FormatterHelper.clearPrefixXML(xmlResponse.data);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    this.logger.log(`user:${'Agency'} [LOG INFO AFTER ProcessPNRPayment] ${JSON.stringify(jsonResponse)} `);
    return jsonResponse;
  }
}
