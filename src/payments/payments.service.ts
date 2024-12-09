import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { AuthService } from 'src/auth/auth.service';
import { StatusCode } from 'src/enums/status-codes.enum';
import { ApisInfoRemoteRepository } from 'src/pnr/apisInfo.remote-repository';
import { PnrRemoteRepository } from 'src/pnr/pnr.remote-repository';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { Parser } from 'src/utils/json-xml.parser';
import { Formatter } from 'src/utils/xml.formatter';
import { CheckoutStatusQueryDto } from './dto/checkout-status-query.dto';
import { EpgPaymentInputDto } from './dto/epg-payment-input.dto';
import { EncryptionService } from './encryption.service';
import { PaymentStatus } from './enum/payment-status.enum';
import { EpgPaymentRemoteRepository } from './repositories/epg-payment.remote-repository';
import { PaymentRemoteRepository } from './repositories/payment.remote-repository';
import { getDifferenceInUtcDates } from 'src/reservations/utils/dateModify';
import { FlightTypes } from './enum/flights-types.enum';
import { StatsdService } from 'src/statsd/statsd.service';
import { NotificationRemoteRepository } from './repositories/notification.remote-repository';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly pnrRemoteRepository: PnrRemoteRepository,
    private readonly encryptionService: EncryptionService,
    private readonly authService: AuthService,
    private readonly epgPaymentRemoteRepository: EpgPaymentRemoteRepository,
    private readonly paymentRemoteRepository: PaymentRemoteRepository,
    private readonly jsonLogger: JsonLogger,
    private readonly reservationRemoteRepository: ReservationRemoteRepository,
    private readonly apisInfoRemoteRepository: ApisInfoRemoteRepository,
    private readonly notificationRemoteRepository: NotificationRemoteRepository,
    private statsdService: StatsdService
  ) {}

  private async getToken(firebaseToken: string) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    return token;
  }

  private getFlight(logicalFlights, comparator) {
    if (!logicalFlights.length) {
      return undefined;
    }

    const firstFlightTime = new Date(logicalFlights[0]['departureTime']);
    const secondFlightTime = new Date(logicalFlights[1]['departureTime']);

    return comparator(firstFlightTime, secondFlightTime) ? logicalFlights[1] : logicalFlights[0];
  }

  private generateStringAlfanumeric() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 3;
    let result = '';

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }

  private getMerchantParamsString(obj: any): string {
    const pairs: string[] = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (!key.startsWith('__')) {
          pairs.push(`${key}:${obj[key]}`);
        }
      }
    }

    const result = pairs.join(';');

    return result;
  }

  async generateCheckoutUrl(paymentInput: EpgPaymentInputDto, firebaseToken: string, user: string): Promise<any> {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const customerId = Date.now().toString();

    let confirmationNumber = paymentInput.confirmationNumber;
    let pnrData;

    paymentInput.merchantId = Number(process.env.MERCHANT_ID);
    paymentInput.productId = Number(process.env.PRODUCT_ID);
    paymentInput.operationType = process.env.OPERATION_TYPE;
    paymentInput.paymentSolution = process.env.PAYMENT_SOLUTION;
    paymentInput.country = 'ES';
    //paymentInput.customerId = '40300761';
    paymentInput.customerId = customerId;
    if (confirmationNumber == null) {
      this.statsdService.timing('_create_checkout_without_confirmation_number', 4000);
      const commitSummaryStart = Date.now();
      pnrData = await this.commitPnr(token, '', user);
      const commitSummaryEnd = Date.now();
      await this.statsdService.timing('_payment_commit_summary_response_time', commitSummaryEnd - commitSummaryStart);
      confirmationNumber = pnrData.confirmationNumber;

      const addApisInfoStart = Date.now();
      const payload = this.apisInfoRemoteRepository.generatePayloadData(paymentInput, pnrData);
      //API DOCS
      const addApisInfoResponse = await this.apisInfoRemoteRepository.addAUpdatepisInfo(
        payload,
        pnrData.confirmationNumber,
        token,
        user
      );

      const addApisInfoException = await this.jsonLogger.processException(
        addApisInfoResponse,
        'AddUpdateApisInfoResponse',
        'AddUpdateApisInfoResult'
      );
      if (addApisInfoException.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(addApisInfoException);
      }
      const addApisInfoEnd = Date.now();

      await this.statsdService.timing('_payment_commit_summary_response_time', addApisInfoEnd - addApisInfoStart);

      const savePnrStart = Date.now();
      const savePnrResponse = await this.pnrRemoteRepository.createPnr(
        token,
        'SaveReservation',
        confirmationNumber,
        user
      );

      const savePnrException = await this.jsonLogger.processException(
        savePnrResponse,
        'CreatePNRResponse',
        'CreatePNRResult'
      );

      if (savePnrException.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(savePnrException);
      }
      const savePnrEnd = Date.now();
      await this.statsdService.timing('_payment_save_pnr_response_time', savePnrEnd - savePnrStart);
    } else {
      const retrievePnrResponse = await this.reservationRemoteRepository.retrievePnr(
        { confirmationNumber, token },
        user
      );
      const retrievePnrException = await this.jsonLogger.processException(
        retrievePnrResponse,
        'RetrievePNRResponse',
        'RetrievePNRResult'
      );

      if (retrievePnrException.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(retrievePnrException);
      }

      pnrData = this.processJsonResponse(retrievePnrResponse, 'RetrievePNRResponse', 'RetrievePNRResult');

      pnrData.payments.payment = Formatter.forceArray(pnrData.payments.payment);

      for (const payment of pnrData.payments.payment) {
        if (parseInt(payment['transactionStatus'])) continue;

        const operationData = {
          status: PaymentStatus.FAIL,
          currency: payment['currencyPaid'],
          amount: payment['baseAmount'],
          payFrexTransactionId: 1,
          merchantTransactionId: payment['reference'],
        };
        await this.paymentRemoteRepository.updateExternalProcessedPayment(
          pnrData,
          operationData,
          confirmationNumber,
          payment.reservationPaymentID,
          token,
          user
        );
      }
      pnrData = this.processJsonResponse(
        await this.pnrRemoteRepository.createPnr(token, 'SaveReservation', confirmationNumber, user),
        'CreatePNRResponse',
        'CreatePNRResult'
      );
      paymentInput.amount = pnrData.reservationBalance;
      paymentInput.currency = pnrData.reservationCurrency;
    }

    const generatePayloadDataStart = Date.now();
    paymentInput.merchantTransactionId = `${confirmationNumber}:${Date.now()}`;

    const reference = `${pnrData.confirmationNumber}-${this.generateStringAlfanumeric()}`;

    const logicalFlights = Formatter.forceArray(pnrData.airlines.airline.logicalFlight.logicalFlight);
    const physicalFlights = Formatter.forceArray(logicalFlights[0].physicalFlights.physicalFlight);
    const airlinePersons = Formatter.forceArray(physicalFlights[0].customers.customer.airlinePersons.airlinePerson);
    const firstPerson =
      airlinePersons.find(({ paxActive, address }) => JSON.parse(paxActive) && address) ||
      airlinePersons.find(({ paxActive }) => JSON.parse(paxActive));
    const firstContact = Formatter.forceArray(pnrData.reservationContacts.reservationContact).find(
      ({ personOrgID }) => personOrgID === firstPerson?.personOrgID
    );

    const contactInfo = pnrData?.contactInfos?.contactInfo
      ? Formatter.forceArray(pnrData?.contactInfos?.contactInfo)
      : [];
    const phone = contactInfo.find(({ contactType }) => !parseInt(contactType));
    const email = contactInfo.find(({ contactType }) => parseInt(contactType) === 4);

    pnrData.reservationContacts.reservationContact = [{ ...firstPerson, ...firstContact }];
    paymentInput.customerCountry = pnrData.reservationContacts.reservationContact[0]?.country;
    paymentInput.addressLine1 = pnrData.reservationContacts.reservationContact[0].address;
    paymentInput.postCode = pnrData.reservationContacts.reservationContact[0].postal;
    paymentInput.customerEmail = String(email?.contactField);
    paymentInput.telephone = String(phone?.contactField).replace('+', '');
    paymentInput.firstName = pnrData.reservationContacts.reservationContact[0].firstName;
    paymentInput.lastName = pnrData.reservationContacts.reservationContact[0].lastName;
    paymentInput.city = pnrData.reservationContacts.reservationContact[0].city;

    const generatePayloadDataEnd = Date.now();
    await this.statsdService.timing(
      '_payment_generate_payload_response_time',
      generatePayloadDataEnd - generatePayloadDataStart
    );

    const insertExternalPaymentStart = Date.now();
    const insertExternalProcessedPaymentResponse = await this.paymentRemoteRepository.insertExternalProcessedPayment(
      pnrData,
      paymentInput,
      token,
      reference,
      user,
      '',
      ''
    );

    const insertExternalProcessedPaymentException = this.jsonLogger.processException(
      insertExternalProcessedPaymentResponse,
      'InsertExternalProcessedPaymentResponse',
      'InsertExternalProcessedPaymentResult'
    );

    if (insertExternalProcessedPaymentException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(insertExternalProcessedPaymentException);
    }

    const insertpPaymentResponse = this.processJsonResponse(
      insertExternalProcessedPaymentResponse,
      'InsertExternalProcessedPaymentResponse',
      'InsertExternalProcessedPaymentResult'
    );

    insertpPaymentResponse.payments.payment = Formatter.forceArray(insertpPaymentResponse.payments.payment);

    const insertExternalPaymentEnd = Date.now();

    await this.statsdService.timing(
      '_payment_insert_external_payment_response_time',
      insertExternalPaymentEnd - insertExternalPaymentStart
    );

    const retrieveApisInfoStart = Date.now();
    const reservationPaymentID = this.findReservationPaymentID(insertpPaymentResponse.payments.payment, reference);
    paymentInput.merchantTransactionId = `${confirmationNumber}:${reservationPaymentID}`;

    const apisInfoResponse = await this.apisInfoRemoteRepository.retrieveApisInfo(
      {
        token,
        confirmationNumber: confirmationNumber,
      },
      user
    );

    const apisInfoException = await this.jsonLogger.processException(
      apisInfoResponse,
      'RetrieveApisInfoResponse',
      'RetrieveApisInfoResult'
    );
    if (apisInfoException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(apisInfoException);
    }

    const apisInfo = Formatter.forceArray(
      apisInfoResponse['s:Body'].RetrieveApisInfoResponse.RetrieveApisInfoResult['a:ApisInfos']['a:ApisInformation']
    );

    const retrieveApisInfoEnd = Date.now();

    await this.statsdService.timing(
      '_payment_retrieve_apis_info_response_time',
      retrieveApisInfoEnd - retrieveApisInfoStart
    );

    const generateMarchantParamsStart = Date.now();
    const bookDate = pnrData.bookDate.split('T')[0];

    const apiInfo = apisInfo.find((apiInfoElement) => apiInfoElement['a:RecordNumber'] == '1');

    const flight = logicalFlights.length > 1 ? this.getFlight(logicalFlights, (a, b) => b < a) : logicalFlights[0];
    const merchantParams = {
      firstName: firstPerson.firstName,
      lastName: firstPerson.lastName,
      activePassengerCount: pnrData.activePassengerCount,
      nationality: apiInfo?.['a:Citizenship'] || '',
      bkdDepartureDateDifference: getDifferenceInUtcDates(bookDate, flight.departureDate.split('T')[0]),
      bkdBillDateTimeDifference: getDifferenceInUtcDates(bookDate, pnrData.todaysDate.split('T')[0]),
      origin: flight.origin,
      destination: flight.destination,
      flightType: logicalFlights.length > 1 ? FlightTypes.RT : FlightTypes.OW,
      channel: process.env.CHANNEL,
    };

    this.jsonLogger.log(`[MerchantParams] ` + JSON.stringify(merchantParams));

    paymentInput.merchantParams = this.getMerchantParamsString(merchantParams);

    const generateMarchantParamsEnd = Date.now();
    delete paymentInput.passengers;

    await this.statsdService.timing(
      '_payment_generate_merchant_params_response_time',
      generateMarchantParamsEnd - generateMarchantParamsStart
    );

    const epgInsertPaymentStart = Date.now();
    const epgPaymentInputDto = plainToInstance(EpgPaymentInputDto, paymentInput) as EpgPaymentInputDto;

    const payload = epgPaymentInputDto.toUrlQueryParams();
    const { encryptedPayload, iv, integrityCheck } = this.encryptionService.encryptPayload(
      payload,
      process.env.EPG_MERCHANT_PASSWORD
    );

    const checkoutUrl = await this.epgPaymentRemoteRepository.sendEncryptedPayload(
      encryptedPayload,
      integrityCheck,
      iv,
      paymentInput.merchantId.toString()
    );

    const epgInsertPaymentEnd = Date.now();
    await this.statsdService.timing(
      '_payment_insert_epg_payment_response_time',
      epgInsertPaymentEnd - epgInsertPaymentStart
    );
    return {
      checkoutUrl: checkoutUrl,
      confirmationNumber: pnrData.confirmationNumber,
    };
  } 

  async savePayment(paymentInput: EpgPaymentInputDto, firebaseToken: string, user: string): Promise<any> {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    /* const customerId = Date.now().toString(); */
    const confirmationNumber = paymentInput.confirmationNumber;

    const retrievePnrResponse = await this.reservationRemoteRepository.retrievePnr({ confirmationNumber, token }, user);
    const retrievePnrException = await this.jsonLogger.processException(
      retrievePnrResponse,
      'RetrievePNRResponse',
      'RetrievePNRResult'
    );

    if (retrievePnrException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(retrievePnrException);
    }

    const pnrData = this.processJsonResponse(retrievePnrResponse, 'RetrievePNRResponse', 'RetrievePNRResult');

    const generatePayloadDataStart = Date.now();
    paymentInput.merchantTransactionId = `${confirmationNumber}:${Date.now()}`;

    const reference = `${pnrData.confirmationNumber}-${this.generateStringAlfanumeric()}`;

    const logicalFlights = Formatter.forceArray(pnrData.airlines.airline.logicalFlight.logicalFlight);
    const physicalFlights = Formatter.forceArray(logicalFlights[0].physicalFlights.physicalFlight);
    const airlinePersons = Formatter.forceArray(physicalFlights[0].customers.customer.airlinePersons.airlinePerson);
    const firstPerson =
      airlinePersons.find(({ paxActive, address }) => JSON.parse(paxActive) && address) ||
      airlinePersons.find(({ paxActive }) => JSON.parse(paxActive));
    const firstContact = Formatter.forceArray(pnrData.reservationContacts.reservationContact).find(
      ({ personOrgID }) => personOrgID === firstPerson?.personOrgID
    );

    const contactInfo = pnrData?.contactInfos?.contactInfo
      ? Formatter.forceArray(pnrData?.contactInfos?.contactInfo)
      : [];
    const phone = contactInfo.find(({ contactType }) => !parseInt(contactType));
    const email = contactInfo.find(({ contactType }) => parseInt(contactType) === 4);

    pnrData.reservationContacts.reservationContact = [{ ...firstPerson, ...firstContact }];
    paymentInput.customerCountry = pnrData.reservationContacts.reservationContact[0]?.country;
    paymentInput.addressLine1 = pnrData.reservationContacts.reservationContact[0].address;
    paymentInput.postCode = pnrData.reservationContacts.reservationContact[0].postal;
    paymentInput.customerEmail = String(email?.contactField);
    paymentInput.telephone = String(phone?.contactField).replace('+', '');
    paymentInput.firstName = pnrData.reservationContacts.reservationContact[0].firstName;
    paymentInput.lastName = pnrData.reservationContacts.reservationContact[0].lastName;
    paymentInput.city = pnrData.reservationContacts.reservationContact[0].city;

    const generatePayloadDataEnd = Date.now();
    await this.statsdService.timing(
      '_payment_generate_payload_response_time',
      generatePayloadDataEnd - generatePayloadDataStart
    );

    const insertExternalPaymentStart = Date.now();
    const insertExternalProcessedPaymentResponse = await this.paymentRemoteRepository.insertExternalProcessedPayment(
      pnrData,
      paymentInput,
      token,
      reference,
      user,
      '',
      'APPROVED'
    );

    const insertExternalProcessedPaymentException = this.jsonLogger.processException(
      insertExternalProcessedPaymentResponse,
      'InsertExternalProcessedPaymentResponse',
      'InsertExternalProcessedPaymentResult'
    );

    if (insertExternalProcessedPaymentException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(insertExternalProcessedPaymentException);
    }
    const insertExternalPaymentEnd = Date.now();

    await this.statsdService.timing(
      '_payment_insert_external_payment_response_time',
      insertExternalPaymentEnd - insertExternalPaymentStart
    );

    const savePnrResponse = await this.pnrRemoteRepository.createPnr(
      token,
      'SaveReservation',
      paymentInput.confirmationNumber,
      user
    );

    const savePnrException = await this.jsonLogger.processException(
      savePnrResponse,
      'CreatePNRResponse',
      'CreatePNRResult'
    );

    if (savePnrException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(savePnrException);
    }
    //seteo estado de reserva
    const newstatus = new CheckoutStatusQueryDto();
    newstatus.confirmationNumber = paymentInput.confirmationNumber;
    newstatus.seriesNumber = '';
    newstatus.status = 'SUCCESS';

    //send email to Client
    await this.notificationRemoteRepository.sendNotification({
      token,
      confirmationNumber: paymentInput.confirmationNumber,
      reservationEmail: paymentInput.customerEmail,
    });

    return await this.setStatus(newstatus);
  }

  private async commitPnr(token: string, confirmationNumber: string, user: string) {
    const pnrResponse = await this.pnrRemoteRepository.createPnr(token, 'CommitSummary', confirmationNumber, user);

    const pnrException = await this.jsonLogger.processException(pnrResponse, 'CreatePNRResponse', 'CreatePNRResult');

    if (pnrException.getStatus() !== StatusCode.SUCCESS) return Promise.reject(pnrException);

    return this.processJsonResponse(pnrResponse, 'CreatePNRResponse', 'CreatePNRResult');
  }

  async setStatus(query: CheckoutStatusQueryDto): Promise<any> {
    const checkoutStatus = plainToInstance(CheckoutStatusQueryDto, query) as CheckoutStatusQueryDto;

    if (checkoutStatus.status === 'SUCCESS') {
      return {
        status: 'SUCCESS',
        message: 'Payment successful',
      };
    } else if (checkoutStatus.status === 'ERROR' || checkoutStatus.status === 'CANCELLED') {
      this.statsdService.timing('_payment_error', 4000);
      return {
        status: 'ERROR',
        message: 'Payment failed',
      };
    } else if (checkoutStatus.status === 'AWAITNG') {
      return {
        status: 'AWAITNG',
        message: 'Payment awaiting',
      };
    }
  }

  // async testSendEmail(request: any): Promise<any> {
  //   const token = await this.authService.retrieveSecurityToken();
  //   const retrievePnrResponse = await this.reservationRemoteRepository.retrievePnr({
  //     confirmationNumber: 'D4IEX6',
  //     token,
  //   });
  //   const pnrData = this.processJsonResponse(retrievePnrResponse, 'RetrievePNRResponse', 'RetrievePNRResult');
  //   const contactInfos = Formatter.forceArray(pnrData.contactInfos.contactInfo);

  //   const email = contactInfos.find(({ contactType }) => parseInt(contactType) === 4)?.contactField;

  //   await this.notificationRemoteRepository.sendNotification({
  //     token,
  //     confirmationNumber: 'D4IEX6',
  //     reservationEmail: email,
  //   });
  // }

  async capturePaymentStatus(request: any): Promise<any> {

    process.stdout.write(JSON.stringify(request.headers) + '\nWEBHOOK XML HEADERS\n');
    process.stdout.write(request.rawBody.toString() + '\nWEBHOOK XML DATA\n');

    const body = request.rawBody.toString();
    const paymentData = await Parser.convertXMLToJSONRaw(body);

    const operations = Formatter.forceArray(paymentData['operations']['operation']);
    const token = await this.authService.retrieveSecurityToken();
    let isSuccesOrFailedStatus = false;
    for await (const operation of operations) {
      const confirmationNumber = (operation['merchantTransactionId'] as string).split(':')[0];
      const reference = operation['merchantTransactionId'];

      process.stdout.write('WebHook confirmationNumber: ' + confirmationNumber);
      process.stdout.write('WebHook merchantTransactionId: ' + operation['merchantTransactionId']);
      process.stdout.write('WebHook reference: ' + reference);

      if (!['SUCCESS_WARNING', 'SUCCESS', 'FAIL', 'ERROR'].includes(operation['status'])) {
        continue;
      }

      isSuccesOrFailedStatus = true;
      const retrievePnrResponse = await this.reservationRemoteRepository.retrievePnr({ confirmationNumber, token }, '');
      const retrievePnrException = await this.jsonLogger.processException(
        retrievePnrResponse,
        'RetrievePNRResponse',
        'RetrievePNRResult'
      );

      if (retrievePnrException.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(retrievePnrException);
      }

      const pnrData = this.processJsonResponse(retrievePnrResponse, 'RetrievePNRResponse', 'RetrievePNRResult');

      const logicalFlights = Formatter.forceArray(pnrData.airlines.airline.logicalFlight.logicalFlight);
      const physicalFlights = Formatter.forceArray(logicalFlights[0].physicalFlights.physicalFlight);
      const airlinePersons = Formatter.forceArray(physicalFlights[0].customers.customer.airlinePersons.airlinePerson);
      const firstPerson = airlinePersons.find(({ paxActive }) => JSON.parse(paxActive));

      pnrData.reservationContacts.reservationContact = [firstPerson];
      const contactInfos = pnrData?.contactInfos?.contactInfo
        ? Formatter.forceArray(pnrData?.contactInfos?.contactInfo)
        : [];

      const email = contactInfos.find(({ contactType }) => parseInt(contactType) === 4)?.contactField;

      //send email to Client
      await this.notificationRemoteRepository.sendNotification({
        token,
        confirmationNumber: confirmationNumber,
        reservationEmail: email,
      });
      const reservationPaymentID = this.findReservationPaymentID(pnrData.payments.payment, reference);

      process.stdout.write('WebHook reservationPaymentID found: ' + reservationPaymentID);

      const updateResponse = await this.paymentRemoteRepository.updateExternalProcessedPayment(
        pnrData,
        operation,
        confirmationNumber,
        reservationPaymentID,
        token,
        ''
      );

      const updateExternalProcessedPaymentDetailsException = await this.jsonLogger.processException(
        updateResponse,
        'UpdateExternalProcessedPaymentDetailsResponse',
        'UpdateExternalProcessedPaymentDetailsResult'
      );

      if (updateExternalProcessedPaymentDetailsException.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(updateExternalProcessedPaymentDetailsException);
      }
    }
    if (isSuccesOrFailedStatus) {
      this.statsdService.timing('_payment_success', 4000);
      return {
        status: 'SUCCESS',
      };
    } else {
      return {
        status: 'AWAITING',
      };
    }
    
  }

  private findReservationPaymentID(payments, reference: string): string | null {
    if (!Array.isArray(payments)) {
      payments = [payments];
    }

    const payment = payments.find(
      (paymentItem) =>
        paymentItem.reference === reference || paymentItem.reservationPaymentID == reference.split(':')[1]
    );

    return payment ? payment.reservationPaymentID : null;
  }

  private processJsonResponse(data: any, response, result) {
    const responseData = data['s:Body'][response][result];
    const stringToSearch = 'a:';
    const replacer = new RegExp(stringToSearch, 'g');
    const json = JSON.parse(JSON.stringify(responseData).replace(replacer, ''));
    delete json.$;
    delete json.Exceptions;
    return Formatter.JSONPropertiesToLowerCamel(json);
  }
}
