import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as moment from 'moment';
import { AuthService } from 'src/auth/auth.service';
import { FareQuotesRemoteRepository } from 'src/fare-quotes/fare-quotes.remote-repository';
import { ReservationService } from 'src/reservations/reservation.service';
import { Formatter } from 'src/utils/xml.formatter';
import { ApisInfoRemoteRepository } from './apisInfo.remote-repository';
import { CreatePnrRequest } from './dto/create-pnr-request.dto';
import { CreatePnrWebRequest } from './dto/create-pnr-web-request.dto';
import { ModifyPNRDto } from './dto/modify-pnr.dto';
import { SegmentDto } from './dto/segment.dto';
import { SummaryPnrRequest, UpdatePassengerInfoDto } from './dto/summary-pnr-request.dto';
import { ActionTypeModifyPnr } from './enums/action-type';
import { PaymentRemoteRepository } from './payment.remote-repository';
import { PnrConverter } from './pnr.converter';
import { PnrRemoteRepository } from './pnr.remote-repository';

import { CheckinRemoteRepository } from 'src/checkin/repositories';
import { StatusCode } from 'src/enums/status-codes.enum';
import { FareQuoteDto } from 'src/fare-quotes/dto/fare-quote.dto';
import { Languages } from 'src/prismic/entities/enum';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { getIdsFromOptionCode } from 'src/prismic/utils/options';
import { FlightOfReservation } from 'src/reservations/responsesDto/get-reservation.dto';
import { EditSeatWithCustomerKeyDto } from 'src/seats/dto';
import { SeatsRemoteRepository } from 'src/seats/seats.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { StatsdService } from 'src/statsd/statsd.service';

@Injectable()
export class PnrService {
  constructor(
    private pnrRemoteRepository: PnrRemoteRepository,
    private authService: AuthService,
    private fareQuotesRemoteRepository: FareQuotesRemoteRepository,
    private reservationService: ReservationService,
    private pnrConverter: PnrConverter,
    private PaymentRemoteRepository: PaymentRemoteRepository,
    private apisInfoRemoteRepository: ApisInfoRemoteRepository,
    private seatsRemoteRepository: SeatsRemoteRepository,
    private checkinRemoteRepository: CheckinRemoteRepository,
    private jsonLogger: JsonLogger,
    private prismicRemoteRepository: PrismicRemoteRepository,
    private statsdService: StatsdService
  ) {}

  private async getToken(firebaseToken: string) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    return token;
  }

  async summaryPnr(request: SummaryPnrRequest, firebaseToken: string, user: string) {
    const token = await this.getToken(firebaseToken);

    const confirmationNumber = request?.reservationInfo?.confirmationNumber;
    if (!confirmationNumber) this.statsdService.timing('_summary_without_confirmation_number', 4000);
    const fareQuoteDto = plainToInstance(FareQuoteDto, request['fareQuoteDetailEntityInput']) as FareQuoteDto;
    // NO ELIMINAR LO SIGUIENTE QUEDA POR DEBUGEO
    // call fare quotes before to persist the session

    fareQuoteDto.fares.forEach((fare, index, fares) => {
      this.applyDateRangeUseCase(fare.departureDate, index, fares, false, fare.arrivalDate);
    });

    const radixxResponse = await this.fareQuotesRemoteRepository.getFareQuoteDateRangeRemote(fareQuoteDto, token, user);

    const exception = await this.jsonLogger.processException(
      radixxResponse,
      'RetrieveFareQuoteDateRangeResponse',
      'RetrieveFareQuoteDateRangeResult'
    );
    if (exception.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(exception);
    }

    const jsonRadixxResponse = this.processJsonResponse(
      radixxResponse,
      'RetrieveFareQuoteDateRangeResponse',
      'RetrieveFareQuoteDateRangeResult'
    );

    const flightSegments = jsonRadixxResponse?.flightSegments['flightSegment'];
    const segments = this.findAndReplaceFareID(
      request.segments,
      Array.isArray(flightSegments) ? flightSegments : [flightSegments]
    );
    //END HOTFIX

    //Linea intercambiada por hotfix
    request = plainToInstance(SummaryPnrRequest, { ...request, segments }) as SummaryPnrRequest;

    const summaryResponse = await this.pnrRemoteRepository.summaryPnr(request, token, user);

    const summaryException = await this.jsonLogger.processException(
      summaryResponse,
      'SummaryPNRResponse',
      'SummaryPNRResult'
    );
    if (summaryException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(summaryException);
    }

    const summaryData = this.processJsonResponse(summaryResponse, 'SummaryPNRResponse', 'SummaryPNRResult');

    const lang = Languages[request?.lang?.toUpperCase()] || Languages['ES-ES'];

    const { services: extras } = await this.prismicRemoteRepository.getServicesPlain({ lang: Languages['PT-PT'] });

    const { options: prismicOptions } = await this.prismicRemoteRepository.getOptionsAndSsrs({
      lang,
    }); // Retrieve Prismic options and ssrs using prismicRemoteRepository.

    const beatufiedSummaryData = this.beautifySummaryData(summaryData, extras, prismicOptions);

    // const pnrResponse = await this.pnrRemoteRepository.createPnr(token, 'CommitSummary', confirmationNumber);

    // const pnrException = await this.jsonLogger.processException(pnrResponse, 'CreatePNRResponse', 'CreatePNRResult');

    // if (pnrException.getStatus() !== StatusCode.SUCCESS) return pnrException;

    // const pnrData = this.processJsonResponse(pnrResponse, 'CreatePNRResponse', 'CreatePNRResult');

    // const addApisInfoResponse = await this.apisInfoRemoteRepository.addAUpdatepisInfo(
    //   request,
    //   pnrData.confirmationNumber,
    //   pnrData,
    //   token
    // );

    // const addApisInfoException = await this.jsonLogger.processException(
    //   addApisInfoResponse,
    //   'AddUpdateApisInfoResponse',
    //   'AddUpdateApisInfoResult'
    // );
    // if (addApisInfoException.getStatus() !== StatusCode.SUCCESS) return addApisInfoResponse;

    //LINEA COMENTADA POR HOTFIX
    // const segments = request.segments;

    // const savePnrReponse = await this.pnrRemoteRepository.createPnr(
    //   token,
    //   'SaveReservation',
    //   pnrData.confirmationNumber
    // );

    // const savePnrException = await this.jsonLogger.processException(
    //   savePnrReponse,
    //   'CreatePNRResponse',
    //   'CreatePNRResult'
    // );
    // if (savePnrException.getStatus() !== StatusCode.SUCCESS) return savePnrException;

    return {
      ...beatufiedSummaryData,
      segments,
      confirmationNumber: confirmationNumber,
    };
  }

  async summaryCreatePnr(request: SummaryPnrRequest, firebaseToken: string, user: string) {
    const token = await this.getToken(firebaseToken);

    const confirmationNumber = request?.reservationInfo?.confirmationNumber;
    if (!confirmationNumber) this.statsdService.timing('_summary_without_confirmation_number', 4000);
    const fareQuoteDto = plainToInstance(FareQuoteDto, request['fareQuoteDetailEntityInput']) as FareQuoteDto;
    // NO ELIMINAR LO SIGUIENTE QUEDA POR DEBUGEO
    // call fare quotes before to persist the session

    fareQuoteDto.fares.forEach((fare, index, fares) => {
      this.applyDateRangeUseCase(fare.departureDate, index, fares, false, fare.arrivalDate);
    });

    const radixxResponse = await this.fareQuotesRemoteRepository.getFareQuoteDateRangeRemote(fareQuoteDto, token, user);

    const exception = await this.jsonLogger.processException(
      radixxResponse,
      'RetrieveFareQuoteDateRangeResponse',
      'RetrieveFareQuoteDateRangeResult'
    );
    if (exception.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(exception);
    }

    const jsonRadixxResponse = this.processJsonResponse(
      radixxResponse,
      'RetrieveFareQuoteDateRangeResponse',
      'RetrieveFareQuoteDateRangeResult'
    );

    const flightSegments = jsonRadixxResponse?.flightSegments['flightSegment'];
    const segments = this.findAndReplaceFareID(
      request.segments,
      Array.isArray(flightSegments) ? flightSegments : [flightSegments]
    );
    //END HOTFIX

    //Linea intercambiada por hotfix
    request = plainToInstance(SummaryPnrRequest, { ...request, segments }) as SummaryPnrRequest;

    const summaryResponse = await this.pnrRemoteRepository.summaryPnr(request, token, user);

    const summaryException = await this.jsonLogger.processException(
      summaryResponse,
      'SummaryPNRResponse',
      'SummaryPNRResult'
    );
    if (summaryException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(summaryException);
    }

    const summaryData = this.processJsonResponse(summaryResponse, 'SummaryPNRResponse', 'SummaryPNRResult');

    const lang = Languages[request?.lang?.toUpperCase()] || Languages['ES-ES'];

    const { services: extras } = await this.prismicRemoteRepository.getServicesPlain({ lang: Languages['PT-PT'] });

    const { options: prismicOptions } = await this.prismicRemoteRepository.getOptionsAndSsrs({
      lang,
    }); // Retrieve Prismic options and ssrs using prismicRemoteRepository.

    const beatufiedSummaryData = this.beautifySummaryData(summaryData, extras, prismicOptions);

    const pnrResponse = await this.pnrRemoteRepository.createPnrWeb(token, 'CommitSummary', user);

    // Procesar la respuesta JSON y verificar si 'CreatePNRResponse' está definido
    if (pnrResponse && pnrResponse['s:Body'] && pnrResponse['s:Body'].CreatePNRResponse) {
        const createPnrResult = pnrResponse['s:Body'].CreatePNRResponse.CreatePNRResult;
        
        if (createPnrResult && createPnrResult['a:ConfirmationNumber']) {
            const confirmationNumberC = createPnrResult['a:ConfirmationNumber'];

            return {
              ...beatufiedSummaryData,
              segments,
              confirmationNumber: confirmationNumberC,
            };
        } else {
            throw new Error('ConfirmationNumber no está definido en la respuesta.');
        }
    } else {
        throw new Error('CreatePNRResponse no está definido en la respuesta.');
    }
    
  }

  async summaryPnrShow(request: SummaryPnrRequest, firebaseToken: string, user: string) {
    const token = await this.getToken(firebaseToken);

    const confirmationNumber = request?.reservationInfo?.confirmationNumber;
    if (!confirmationNumber) this.statsdService.timing('_summary_without_confirmation_number', 4000);
    const fareQuoteDto = plainToInstance(FareQuoteDto, request['fareQuoteDetailEntityInput']) as FareQuoteDto;
    // NO ELIMINAR LO SIGUIENTE QUEDA POR DEBUGEO
    // call fare quotes before to persist the session

    fareQuoteDto.fares.forEach((fare, index, fares) => {
      this.applyDateRangeUseCase(fare.departureDate, index, fares, false, fare.arrivalDate);
    });

    const radixxResponse = await this.fareQuotesRemoteRepository.getFareQuoteDateRangeRemote(fareQuoteDto, token, user);

    const exception = await this.jsonLogger.processException(
      radixxResponse,
      'RetrieveFareQuoteDateRangeResponse',
      'RetrieveFareQuoteDateRangeResult'
    );
    if (exception.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(exception);
    }

    const jsonRadixxResponse = this.processJsonResponse(
      radixxResponse,
      'RetrieveFareQuoteDateRangeResponse',
      'RetrieveFareQuoteDateRangeResult'
    );

    const flightSegments = jsonRadixxResponse?.flightSegments['flightSegment'];
    const segments = this.findAndReplaceFareID(
      request.segments,
      Array.isArray(flightSegments) ? flightSegments : [flightSegments]
    );
    //END HOTFIX

    //Linea intercambiada por hotfix
    request = plainToInstance(SummaryPnrRequest, { ...request, segments }) as SummaryPnrRequest;

    const summaryResponse = await this.pnrRemoteRepository.summaryPnr(request, token, user);

    const summaryException = await this.jsonLogger.processException(
      summaryResponse,
      'SummaryPNRResponse',
      'SummaryPNRResult'
    );
    if (summaryException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(summaryException);
    }

    const summaryData = this.processJsonResponse(summaryResponse, 'SummaryPNRResponse', 'SummaryPNRResult');

    const lang = Languages[request?.lang?.toUpperCase()] || Languages['ES-ES'];

    const { services: extras } = await this.prismicRemoteRepository.getServicesPlain({ lang: Languages['PT-PT'] });

    const { options: prismicOptions } = await this.prismicRemoteRepository.getOptionsAndSsrs({
      lang,
    }); // Retrieve Prismic options and ssrs using prismicRemoteRepository.

    const beatufiedSummaryData = this.beautifySummaryData(summaryData, extras, prismicOptions);

    return {
      ...beatufiedSummaryData,
      segments,
      confirmationNumber: confirmationNumber,
    };
  }

  private forceArray(object): any[] {
    return Array.isArray(object) ? object : [object];
  }

  private removeCDATA(input: string): string {
    return input.replace(/<!\[CDATA\[(.*)\]\]>/, '$1');
  }

  private beautifySummaryData(summaryData, extras = [], prismicOptions = []): any {
    const { reservationBalance } = summaryData;
    const flights = this.forceArray(summaryData.airlines.airline.logicalFlight.logicalFlight);

    const chargesSummary: {
      [taxID: string]: {
        howManyDistinctPersonsHadThisTax: number;
        taxID: string;
        totalAmount: number;
        count: number;
        taxDescription: string;
      };
    } = {};
    const distinctAirlinePersonKeys: { [taxID: string]: { [personOrgID: string]: boolean } } = {};

    const extrasSummary: {
      [taxID: string]: {
        howManyDistinctPersonsHadThisTax: number;
        taxID: string;
        totalAmount: number;
        count: number;
        taxDescription: string;
      };
    } = {};
    const distinctExtrasAirlinePersonKeys: { [taxID: string]: { [personOrgID: string]: boolean } } = {};

    const passengerTypeMapping = {
      1: 'Adulto',
      6: 'Niño',
      5: 'Bebe',
    };

    const passengerSummary: {
      [flightIndex: string]: {
        [passengerType: string]: {
          passengerType: string;
          count: number;
          webFareType: string;
          fareAmount: number;
          stringIndex: string;
        };
      };
    } = {};

    for (const flightIndex in flights) {
      const flight = flights[flightIndex];
      const stringIndex = flightIndex.toString();

      const physicalFlights = this.forceArray(flight.physicalFlights.physicalFlight);

      physicalFlights.forEach((physicalFlight) => {
        const customers = this.forceArray(physicalFlight.customers.customer);

        customers.forEach((customer) => {
          const airlinePersons = this.forceArray(customer.airlinePersons.airlinePerson);

          airlinePersons.forEach((airlinePerson) => {
            if (airlinePerson.webFareType != null) {
              const personOrgID = airlinePerson.personOrgID;
              const passengerType = passengerTypeMapping[airlinePerson.PTCID];
              const webFareType = airlinePerson.webFareType.split(':')[1];
              const fareAmount = parseFloat(airlinePerson.fareAmount);

              if (passengerSummary[stringIndex] && passengerSummary[stringIndex][passengerType]) {
                passengerSummary[stringIndex][passengerType].count++;
              } else {
                const passenger = {
                  passengerType: passengerType,
                  webFareType: webFareType,
                  fareAmount: fareAmount,
                  count: 1,
                  stringIndex: stringIndex,
                };
                if (!passengerSummary[stringIndex]) {
                  passengerSummary[stringIndex] = {};
                }
                passengerSummary[stringIndex][passengerType] = passenger;
              }

              const charges = this.forceArray(airlinePerson.charges.charge);

              charges.forEach((charge) => {
                if (charge.codeType !== 'AIR' && charge.isSSR !== 'true') {
                  const taxID = charge.taxID;
                  const amount = parseFloat(charge.amount);
                  const cleanedChargeComment = this.removeCDATA(charge.chargeComment);

                  if (!chargesSummary[taxID]) {
                    chargesSummary[taxID] = {
                      howManyDistinctPersonsHadThisTax: 0,
                      taxID: taxID,
                      totalAmount: 0,
                      count: 1,
                      taxDescription: cleanedChargeComment,
                    };
                    distinctAirlinePersonKeys[taxID] = {};
                  } else {
                    chargesSummary[taxID].count += 1;
                  }

                  chargesSummary[taxID].totalAmount += amount;
                  if (!distinctAirlinePersonKeys[taxID][personOrgID]) {
                    distinctAirlinePersonKeys[taxID][personOrgID] = true;
                    chargesSummary[taxID].howManyDistinctPersonsHadThisTax += 1;
                  }
                } else if (charge.isSSR === 'true') {
                  const taxID = charge.codeType;
                  const amount = parseFloat(charge.amount);
                  const cleanedChargeComment = charge.description;

                  if (!extrasSummary[taxID]) {
                    extrasSummary[taxID] = {
                      howManyDistinctPersonsHadThisTax: 0,
                      taxID: taxID,
                      totalAmount: 0,
                      count: 1,
                      taxDescription: cleanedChargeComment,
                    };
                    distinctExtrasAirlinePersonKeys[taxID] = {};
                  } else {
                    extrasSummary[taxID].count += 1;
                  }

                  extrasSummary[taxID].totalAmount += amount;
                  if (!distinctExtrasAirlinePersonKeys[taxID][personOrgID]) {
                    distinctExtrasAirlinePersonKeys[taxID][personOrgID] = true;
                    extrasSummary[taxID].howManyDistinctPersonsHadThisTax += 1;
                  }
                }
              });
            }
          });
        });
      });
    }

    const chargesSummaryArray = Object.values(chargesSummary);

    const extrasSummaryArray = Object.values(extrasSummary);

    let totalCharges = 0;
    chargesSummaryArray.forEach((charge) => {
      totalCharges += charge.totalAmount;
    });

    let totalSummaryCharges = 0;
    extrasSummaryArray.forEach((charge) => {
      totalSummaryCharges += charge.totalAmount;
    });

    const returnObject = {
      reservationBalance,
      promotionalCode: summaryData.promotionalCode,
      chargesSummary: chargesSummaryArray.map((chargeSummary) => {
        return {
          ...chargeSummary,
          taxDescription: chargeSummary.taxDescription
            ? chargeSummary.taxDescription.split(':')[1].trim()
            : chargeSummary.taxDescription,
        };
      }),
      extrasSummary: extrasSummaryArray.map((extraSummary) => {
        const prismicsIDs = getIdsFromOptionCode(extraSummary.taxID, extras);
        const prismicOption = prismicOptions.find(
          ({ ssrId, id: prismicOptionId }) =>
            ssrId === prismicsIDs?.extraId && prismicOptionId === prismicsIDs?.optionId
        ); // Get the Prismic option based on ssrId, id, and prismicOptionId.
        return {
          ...extraSummary,
          taxDescription: prismicOption?.title || extraSummary.taxDescription,
        };
      }),
      flightsPassengerSummary: passengerSummary,
      totalCharges: totalCharges,
      totalSummaryCharges: totalSummaryCharges,
    };

    return returnObject;
  }

  private applyDateRangeUseCase(departureDate, index, fares, isFarequoteDetail, arrivalDate) {
    // if (isFarequoteDetail) {
    //   fares[index].departureDate = departureDate;
    //   fares[index].arrivalDate = departureDate;
    // } else {
    const departureDateMoment = moment(departureDate);
    const arrivalDateMoment = moment(arrivalDate);
    if (!index) {
      fares[index].departureDate = departureDateMoment.startOf('month').format('YYYY-MM-DD');
      fares[index].arrivalDate = departureDateMoment.endOf('month').format('YYYY-MM-DD');
    } else {
      fares[index].departureDate = arrivalDateMoment.startOf('month').format('YYYY-MM-DD');
      fares[index].arrivalDate = arrivalDateMoment.endOf('month').format('YYYY-MM-DD');
    }
  }

  async createPnr(request: CreatePnrRequest) {
    // TODO: ver que pasa con createPnr que dejo de andar
    // const pnrData = this.processJsonResponse(this.pnrRemoteRepository.createPnr(request, request.token, 'CommitSummary'), 'CreatePNRResponse', 'CreatePNRResult');
    // create worldpay checkout url
    // const orderCode = this.generateOrderCode(pnrData['SeriesNumber'], pnrData['ConfirmationNumber']);

    const worldPayCheckoutUrl = await this.PaymentRemoteRepository.getCheckoutUrl(
      Math.floor(Math.random() * 10000),
      `IBEROJET`,
      request.currency,
      request.balance /*pnrData['ReservationCurrency'], pnrData['ReservationBalance']*/
    );

    return {
      reference: worldPayCheckoutUrl.reply.orderStatus.reference['_'],
    };
  }

  async createPnrWeb(request: CreatePnrWebRequest, firebaseToken: string, user: string) {
    const token = await this.getToken(firebaseToken);
    const pnrResponse = await this.pnrRemoteRepository.createPnrWeb(token, 'CommitSummary', user);

    // Procesar la respuesta JSON y verificar si 'CreatePNRResponse' está definido
    if (pnrResponse && pnrResponse['s:Body'] && pnrResponse['s:Body'].CreatePNRResponse) {
        const createPnrResult = pnrResponse['s:Body'].CreatePNRResponse.CreatePNRResult;
        
        if (createPnrResult && createPnrResult['a:ConfirmationNumber']) {
            const confirmationNumber = createPnrResult['a:ConfirmationNumber'];
            return {
              logicalFlightID: request.logicalFlightID,
              confirmationNumber: confirmationNumber,
            };
        } else {
            throw new Error('ConfirmationNumber no está definido en la respuesta.');
        }
    } else {
        throw new Error('CreatePNRResponse no está definido en la respuesta.');
    }

  }

  private generateOrderCode(confirmationNumber: string, seriesNumber: string) {
    return `${seriesNumber}:${confirmationNumber}`;
  }

  private findAndReplaceFareID(segments = [], flightSegments = []) {
    return segments.map((segment: SegmentDto) => {
      const logicalFlight = segment.logicalFlightID;
      const { fBCode } = segment;
      const flightSegment = flightSegments.find(({ LFID }) => LFID === logicalFlight);
      let foundFareInfo = null;

      flightSegment?.fareTypes.fareType.forEach((fareType) => {
        const fareInfos = fareType['fareInfos']['fareInfo'];
        if (fareInfos.length) {
          const fareInfo = fareInfos.find(({ FBCode }) => fBCode === FBCode);
          if (fareInfo) {
            foundFareInfo = fareInfo;
          }
        }
      });

      if(foundFareInfo == null){
        return {
          ...segment,
          fareInformationID: 1,
          baseFareAmtNoTaxes: foundFareInfo?.baseFareAmtNoTaxes,
        };
      }

      return {
        ...segment,
        fareInformationID: foundFareInfo?.fareID,
        baseFareAmtNoTaxes: foundFareInfo?.baseFareAmtNoTaxes,
      };

    });
  }

  async updatePassengersInfo(request: UpdatePassengerInfoDto, firebaseToken, user: string) {
    const { confirmationNumber, passengers } = request;
    const token = await this.getToken(firebaseToken);
    const reservation = await this.reservationService.getReservation({ confirmationNumber }, token);

    if (!reservation['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']) {
      return null;
    }

    const flights = Array.isArray(
      reservation['s:Body'].RetrievePNRResponse.RetrievePNRResult['a:Airlines']['a:Airline']['a:LogicalFlight'][
        'a:LogicalFlight'
      ]
    )
      ? reservation['s:Body'].RetrievePNRResponse.RetrievePNRResult['a:Airlines']['a:Airline']['a:LogicalFlight'][
          'a:LogicalFlight'
        ]
      : [
          reservation['s:Body'].RetrievePNRResponse.RetrievePNRResult['a:Airlines']['a:Airline']['a:LogicalFlight'][
            'a:LogicalFlight'
          ],
        ];

    const airlinePersons = [];
    for (const flight of flights) {
      const legs = Array.isArray(flight['a:PhysicalFlights']['a:PhysicalFlight'])
        ? flight['a:PhysicalFlights']['a:PhysicalFlight']
        : [flight['a:PhysicalFlights']['a:PhysicalFlight']];
      for (const leg of legs) {
        if (leg['a:PhysicalFlightID']) {
          const persons = Array.isArray(leg['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'])
            ? leg['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']
            : [leg['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']];
          airlinePersons.push(...persons);
        }
      }
    }
    const apisInfoResponse = await this.apisInfoRemoteRepository.retrieveApisInfo({ token, confirmationNumber }, user);
    const apisInfo =
      apisInfoResponse['s:Body'].RetrieveApisInfoResponse.RetrieveApisInfoResult?.['a:ApisInfos']?.[
        'a:ApisInformation'
      ] || [];

    const passengerList = [];
    for (const passenger of passengers) {
      airlinePersons.filter((person) => {
        if (person['a:PersonOrgID'] != passenger.personOrgID) return false;

        passengerList.push(
          this.pnrConverter.updatePassengerInformation(
            passenger,
            Array.isArray(apisInfo)
              ? apisInfo.find((apiInfo) => apiInfo['a:RecordNumber'] == person['a:RecordNumber'])
              : apisInfo['a:RecordNumber'] == person['a:RecordNumber']
              ? apisInfo
              : {}
          )
        );
        return true;
      });
    }

    await this.apisInfoRemoteRepository.addAUpdatepisInfo(passengerList, confirmationNumber, token, user);

    await this.pnrRemoteRepository.createPnr(token, 'SaveReservation', confirmationNumber, user);

    return new HttpException('Passenger was successfully modified', HttpStatus.OK);
  }

  async modifyPnr(request: ModifyPNRDto, firebaseToken: string, user: string): Promise<any | HttpException> {
    const {
      confirmationNumber,
      specialServices,
      seats,
      reservationKey,
      // doCheckin,
      // passengers,
    } = request;
    const token = await this.getToken(firebaseToken);
    const reservation = await this.reservationService.retrieveReservation(
      {
        confirmationNumber,
      },
      firebaseToken,
      false,
      user
    );

    // Check PaymentStatus (true)
    if (!reservation?.paymentStatus) return new HttpException('PaymentStatus is not true yet.', HttpStatus.CONFLICT);

    // if (doCheckin && !seats.length && !specialServices.length) {
    //   const createCheckinDto: CreateCheckinWihtTokenDto = {
    //     confirmationNumber,
    //     seriesNumber,
    //     reservationKey,
    //     logicalFlightKey,
    //     physicalFlightKey,
    //     passengers,
    //     token,
    //     customerKey,
    //   };

    //   await this.checkinRemoteRepository.createCheckin(createCheckinDto);
    //   return await this.pnrRemoteRepository.createPnr(token, 'SaveReservation', confirmationNumber);
    // }

    if (seats.length)
      for (const seat of seats) {
        let customerKey;
        const flight = reservation?.flights.find(
          (flight: FlightOfReservation) =>
            flight.logicalFlightKey == seat.logicalFlightKey && flight.physicalFlightKey == seat.physicalFlightKey
        );

        if (!flight) return new HttpException('CustomerKey not found.', HttpStatus.CONFLICT);

        for (const leg of flight.flights) {
          if (leg.physicalFlightID == seat.physicalFlightID && !customerKey) customerKey = leg.customerKey;
        }

        if (!customerKey) return new HttpException('CustomerKey not found.', HttpStatus.CONFLICT);
        const editSeatDto: EditSeatWithCustomerKeyDto = {
          seats: [seat],
          customerKey,
          confirmationNumber,
          reservationKey,
        };
        const seatResponse = await this.seatsRemoteRepository.editSeats(
          editSeatDto,
          {
            token,
            customerKey,
          },
          seat.oldSeat ? 'ChangePassengerSeat' : 'AssignPassengerSeat',
          user
        );
        const exception = await this.jsonLogger.processException(
          seatResponse,
          'SeatAssignmentResponse',
          'SeatAssignmentResult'
        );
        if (exception.getStatus() !== StatusCode.SUCCESS) return Promise.reject(exception);
      }

    if (specialServices.length) {
      const serviceList = specialServices.map((singleServiceRequest) =>
        this.pnrConverter.addSpecialServices(singleServiceRequest)
      );
      const specialServicesResponse = await this.pnrRemoteRepository.modifyPnr(
        request,
        token,
        ActionTypeModifyPnr.ADD_SPECIAL_SERVICES,
        serviceList,
        user
      );

      const exception = await this.jsonLogger.processException(
        specialServicesResponse,
        'ModifyPNRResponse',
        'ModifyPNRResult'
      );
      if (exception.getStatus() !== StatusCode.SUCCESS) return Promise.reject(exception);
    }

    await this.pnrRemoteRepository.createPnr(token, 'SaveReservation', confirmationNumber, user);

    return new HttpException('Pnr was successfully modified', HttpStatus.OK);
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
