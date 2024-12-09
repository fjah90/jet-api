import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { PnrRemoteRepository } from 'src/pnr/pnr.remote-repository';
import { ReservationRemoteRepository } from 'src/reservations/reservation.remote-repository';
import { Formatter } from 'src/utils/xml.formatter';
import { EditSeatDto } from './dto';
import { SeatsInputDto } from './dto/seats-input.dto';
import { SeatsRemoteRepository } from './seats.remote-repository';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { JsonLogger } from 'src/utils/json-logger';
import { StatusCode } from 'src/enums/status-codes.enum';
import { StatsdService } from 'src/statsd/statsd.service';
import { GetSeatListResponse } from './responsesDto/seat-list.dto';
import { PassengerOfSeatListRequestDto } from 'src/reservations/dto';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { customSeats } from 'src/prismic/utils/seatsColors';

interface messageElement {
  title: string;
  items: string[];
}

@Injectable()
export class SeatsService {
  private calculateAge(dateOfBirth: string): number {
    const dob = new Date(dateOfBirth);
    const currentDate = new Date();
    let age = currentDate.getFullYear() - dob.getFullYear();

    // Adjust age if birthday has not yet been reached this year
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();

    const birthMonth = dob.getMonth() + 1;
    const birthDay = dob.getDate();

    if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
      age--;
    }

    return age;
  }

  private calculateExitRules(passenger): { hasMessageBlocked: boolean; hasMessageWarning: boolean } {
    let hasMessageBlocked = false;
    let hasMessageWarning = false;

    if (passenger.age < 16 || [5, 6].includes(parseInt(passenger.passengerTypeID))) hasMessageBlocked = true;
    else hasMessageWarning = true;
    return { hasMessageBlocked, hasMessageWarning };
  }

  private formatExitMessage(extraDocument): { messageBlocked: messageElement; messageWarning: messageElement } {
    const messageBlocked: messageElement = {
      title: extraDocument?.passengerNotAllowedToSelectSeatModalContent[0].text,
      items: extraDocument?.passengerNotAllowedToSelectSeatModalContent
        .map((emergencyRule, index) => {
          if (!index) return null;

          return emergencyRule.text;
        })
        .filter(Boolean),
    };

    const messageWarning: messageElement = {
      title: extraDocument?.seatsEmergencyWarningModalContent[0].text,
      items: extraDocument?.seatsEmergencyWarningModalContent
        .map((emergencyRule, index) => {
          if (!index) return null;

          return emergencyRule.text;
        })
        .filter(Boolean),
    };

    return { messageWarning, messageBlocked };
  }

  private logger = new JsonLogger(SeatsService.name);
  constructor(
    private authService: AuthService,
    private reservationRemoteRepository: ReservationRemoteRepository,
    private pnrRemoteRepository: PnrRemoteRepository,
    private fareQuotesService: FareQuotesService,
    private SeatsRemoteRepository: SeatsRemoteRepository,
    private jsonLogger: JsonLogger,
    private statsdService: StatsdService,
    private prismicRemoteRepository: PrismicRemoteRepository
  ) {}
  public async getSeatsRemote(seatsInputDto: SeatsInputDto, firebaseToken: string, user: string) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);

    const seatResponse = await this.SeatsRemoteRepository.getSeatsRemote(seatsInputDto, token, user);

    const exception = await this.jsonLogger.processException(
      seatResponse,
      'RetrieveFlightSeatMapResponse',
      'RetrieveFlightSeatMapResult'
    );

    if (exception.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(exception);
    }
    return this.availableResponseMapper(seatResponse, 'RetrieveFlightSeatMapResponse', 'RetrieveFlightSeatMapResult');
  }

  public async getSeatList(
    seatsInputDto: SeatsInputDto,
    firebaseToken: string,
    user: string
  ): Promise<GetSeatListResponse> {
    const { fareBundle, serviceBundle, airportCode, destinationAirportCode } = seatsInputDto;
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const seatListstart = Date.now();
    const seatListResponse = await this.SeatsRemoteRepository.getSeatList(seatsInputDto, token, user);
    const seatListEnd = Date.now();

    await this.statsdService.timing('_seat_list_response_time', seatListEnd - seatListstart);
    const seatListexception = this.jsonLogger.processException(
      seatListResponse,
      'RetrieveSeatAvailabilityListResponse',
      'RetrieveSeatAvailabilityListResult'
    );

    if (seatListexception.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(seatListexception);
    }

    const response = this.availableResponseMapper(
      seatListResponse,
      'RetrieveSeatAvailabilityListResponse',
      'RetrieveSeatAvailabilityListResult'
    );

    const prismicstart = Date.now();
    const extrasDocument = await this.prismicRemoteRepository.getExtrasDocument(seatsInputDto);
    const prismicEnd = Date.now();
    await this.statsdService.timing('_seat_list_prismic_response_time', prismicEnd - prismicstart);

    const { messageBlocked, messageWarning } = this.formatExitMessage(extrasDocument);
    const AArQuotestart = Date.now();
    const aarQuoteResponse = await this.reservationRemoteRepository.retrieveAARQuote(
      {
        ...seatsInputDto,
        airportCode: seatsInputDto.airportCodeLF,
        destinationAirportCode: seatsInputDto.destinationAirportCodeLF,
        currency: seatsInputDto.currencyCode,
        passengers: [{ passengerTypeID: '1' }, { passengerTypeID: '5' }, { passengerTypeID: '6' }],
        token,
      },
      user
    );
    const AArQuoteEnd = Date.now();

    await this.statsdService.timing('_seat_list_AArQuote_response_time', AArQuoteEnd - AArQuotestart);
    const ARRQuoteexception = await this.jsonLogger.processException(
      aarQuoteResponse,
      'RetrieveAARQuoteResponse',
      'RetrieveAARQuoteResult'
    );

    if (ARRQuoteexception.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(ARRQuoteexception);
    }

    const ARRQuote = this.availableResponseMapper(
      aarQuoteResponse,
      'RetrieveAARQuoteResponse',
      'RetrieveAARQuoteResult'
    );

    const viewAARQuote = ARRQuote.serviceQuotes?.viewAARQuote;

    const serviceBundleStart = Date.now();
    const serviceBundleDetails = serviceBundle
      ? await this.fareQuotesService.getServiceBundleDetails(serviceBundle, firebaseToken, user)
      : null;
    const serviceBundleEnd = Date.now();
    await this.statsdService.timing('_seat_list_service_bundle_response_time', serviceBundleEnd - serviceBundleStart);

    const fareBundleStart = Date.now();
    const fareBundleDetails = fareBundle
      ? await this.fareQuotesService.getFareBundleDetails(fareBundle, firebaseToken, user)
      : null;
    const fareBundleEnd = Date.now();
    await this.statsdService.timing('_seat_list_fare_bundle_response_time', fareBundleEnd - fareBundleStart);

    const serviceBundles = serviceBundleDetails?.bundleServiceDetails?.bundleServiceDetail || {};
    const fareBundles = fareBundleDetails?.bundleServiceDetails?.bundleServiceDetail || {};
    return {
      messageWarning,
      messageBlocked,
      ...this.processAllPhysicalFlights({
        jsonData: response,
        serviceBundle: serviceBundles,
        fareBundle: fareBundles,
        servicesQuote: viewAARQuote,
        originAirportCode: airportCode,
        destinationAirportCode: destinationAirportCode,
        passengers: seatsInputDto.passengers.map((passenger: PassengerOfSeatListRequestDto) => ({
          ...passenger,
          age: this.calculateAge(passenger.DOB),
        })),
      }),
    };
  }

  public async editSeats(editSeatDto: EditSeatDto, firebaseToken: string, user: string) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const { confirmationNumber } = editSeatDto;
    const { airlines } = this.availableResponseMapper(
      await this.reservationRemoteRepository.retrievePnr({ confirmationNumber, token }, user),
      'RetrievePNRResponse',
      'RetrievePNRResult'
    );

    if (!airlines) return new HttpException('Reservation not found.', HttpStatus.NOT_FOUND);

    const customerKey =
      airlines['airline']['logicalFlight']['logicalFlight']['physicalFlights']['physicalFlight']['customers'][
        'customer'
      ]['key'];
    const response = await this.availableResponseMapper(
      await this.SeatsRemoteRepository.editSeats(editSeatDto, { token, customerKey }, 'ChangePassengerSeat', user),
      'SeatAssignmentResponse',
      'SeatAssignmentResult'
    );
    return response;
  }

  private availableResponseMapper(response: any, objectName: string, propertyName: string) {
    const responseData = response['s:Body'][objectName][propertyName];
    const stringToSearch = 'a:';
    const replacer = new RegExp(stringToSearch, 'g');
    const json = JSON.parse(JSON.stringify(responseData).replace(replacer, ''));
    delete json.$;
    delete json.Exceptions;
    return Formatter.JSONPropertiesToLowerCamel(json);
  }

  private processAllPhysicalFlights({
    jsonData,
    serviceBundle,
    fareBundle,
    servicesQuote,
    originAirportCode,
    destinationAirportCode,
    passengers,
  }) {
    if (!Array.isArray(jsonData.physicalFlights.physicalFlight)) {
      jsonData.physicalFlights.physicalFlight = [jsonData.physicalFlights.physicalFlight];
    }

    const physicalFlights = jsonData.physicalFlights.physicalFlight;

    const flights: any[] = [];
    physicalFlights.forEach((physicalFlight) => {
      if (physicalFlight.origin === originAirportCode && physicalFlight.destination === destinationAirportCode) {
        const { processedCabin: cabinsData, seatCodesFiltered: seatCodes } = this.processCabinData(
          physicalFlight.cabins,
          serviceBundle,
          fareBundle,
          servicesQuote,
          passengers,
          physicalFlight?.seatCodes?.seatCode
        );
        flights.push({
          physicalFlightID: physicalFlight.physicalFlightID,
          departureDate: physicalFlight.departureDate,
          origin: physicalFlight.origin,
          destination: physicalFlight.destination,
          originName: physicalFlight.originName,
          destinationName: physicalFlight.destinationName,
          tailNum: physicalFlight.tailNum,
          flightNum: physicalFlight.flightNum,
          isCircularFlight: physicalFlight.isCircularFlight,
          legOrder: physicalFlight.legOrder,
          displayLegOnSeatmap: physicalFlight.displayLegOnSeatmap,
          seatCodes,
          cabins: cabinsData,
        });
      }
    });

    return {
      flights: flights,
    };
  }

  private processCabinData(cabins, serviceBundle, fareBundle, servicesQuote, passengers: [], seatCodes) {
    if (!Array.isArray(cabins.cabin)) {
      cabins.cabin = [cabins.cabin];
    }

    const processedCabin: any[] = [];
    const seatCodesFiltered = [];
    const passengersWithExitRules = passengers.map((passenger) => ({
      key: passenger['key'],
      ...this.calculateExitRules(passenger),
    }));

    const blockedPersonOrgIds = passengersWithExitRules
      .filter(({ hasMessageBlocked }) => hasMessageBlocked)
      .map(({ key }) => key);
    const warningPersonOrgIds = passengersWithExitRules
      .filter(({ hasMessageWarning }) => hasMessageWarning)
      .map(({ key }) => key);

    cabins.cabin.map((cabin) => {
      const largestRowString = this.extractLargestSeatsStringForeachCabin(cabin);
      const lastRowNumber = this.getLastRowNumberOfCabin(cabin);
      const seats: any[] = [];
      const seatAssignments = cabin?.seatAssignments?.seatAssignment;

      for (let i = 1; i <= lastRowNumber; i++) {
        const seatsLetters = largestRowString.seats.replace(/ +/g, ' ').split('');
        seatsLetters.forEach((rowLetter) => {
          if (rowLetter === ' ') {
          } else {
            const seatMapData = this.getSeatMapDataForSeat(rowLetter, i.toString(), cabin);
            const seatChargeData = this.getSeatChargeDataForSeat(
              rowLetter,
              i.toString(),
              cabin,
              serviceBundle,
              fareBundle,
              servicesQuote
            );
            const seatReserved = seatAssignments
              ? Array.isArray(seatAssignments)
                ? seatAssignments.some(({ rowNumber, seat }) => rowNumber === i.toString() && seat === rowLetter)
                : seatAssignments?.rowNumber === i.toString() && seatAssignments?.seat === rowLetter
              : false;

            if (
              seatChargeData?.serviceCode &&
              !seatCodesFiltered.some(
                (seatCodeFiltered) => seatCodeFiltered.serviceCode === seatChargeData?.serviceCode
              )
            )
              seatCodesFiltered.push(
                seatCodes.find((seatCode) => seatCode?.serviceCode === seatChargeData?.serviceCode)
              );
            seats.push({
              ...seatChargeData,
              ...seatMapData,
              reserved: seatReserved,
              blockedPersonOrgIds: seatMapData.isExit ? blockedPersonOrgIds : [],
              warningPersonOrgIds: seatMapData.isExit ? warningPersonOrgIds : [],
            });
          }
        });
      }

      processedCabin.push({
        cabinName: cabin.cabinName,
        columns: largestRowString,
        seats: seats,
      });
    });

    const prismicSeats = customSeats.map(({ code }) => ({ serviceCode: code }));
    return { processedCabin, seatCodesFiltered: [...seatCodesFiltered, ...prismicSeats] };
  }

  private getSeatMapDataForSeat(rowLetter, lastRowNumber, cabin) {
    const seatMap = cabin.seatMaps.seatMap.find((seatMap) => seatMap.rowNumber === lastRowNumber);
    const seatException = Formatter.forceArray(cabin.seatExceptions.seatException).find(
      (seatException) => seatException.rowNumber === lastRowNumber && seatException.seat == rowLetter
    );

    let isExit = false;
    if ('exitSeats' in seatMap) {
      isExit = seatMap.exitSeats.includes(rowLetter);
    }

    let isBlocked = false;
    if ('blockedSeats' in seatMap) {
      isBlocked = seatMap.blockedSeats.includes(rowLetter);
    }

    if (seatException) isBlocked = true;

    const isReal = seatMap.seats.includes(rowLetter);

    return {
      isExit,
      isBlocked,
      isReal,
    };
  }

  private getSeatChargeDataForSeat(rowLetter, lastRowNumber, cabin, serviceBundles, fareBundles, servicesQuote = []) {
    const seatCharge = cabin.seatCharges.seatCharge.find(
      (seatCharge) => seatCharge.rowNumber === lastRowNumber && seatCharge.seat === rowLetter
    );
    if (seatCharge) {
      const serviceQuote = servicesQuote.find(({ SSRCode }) => SSRCode == seatCharge?.serviceCode);
      const serviceBundle = Array.isArray(serviceBundles)
        ? serviceBundles.some(({ ssrCode }) => ssrCode === seatCharge?.serviceCode)
        : serviceBundles?.ssrCode === seatCharge?.serviceCode;

      const fareBundle = Array.isArray(fareBundles)
        ? fareBundles.some(({ ssrCode }) => ssrCode === seatCharge?.serviceCode)
        : fareBundles?.ssrCode === seatCharge?.serviceCode;
      return {
        ...seatCharge,
        amount: fareBundle || serviceBundle ? '0' : seatCharge?.amount,
        serviceID: serviceQuote?.serviceID,
        categoryID: serviceQuote?.categoryID,
      };
    } else {
      return {
        rowNumber: lastRowNumber,
        seat: rowLetter,
        serviceCode: '',
        amount: '0',
        currency: '',
        serviceID: '',
        categoryID: '',
      };
    }
  }

  private extractLargestSeatsStringForeachCabin(cabin) {
    const largestSeatMap = cabin.seatMaps.seatMap.reduce((largestSeatMap, seatMap) => {
      const largestSeatMapSeats = largestSeatMap.seats.replace(/(\s{2,})/g, '  ').length;
      const seatMapSeats = seatMap.seats.replace(/(\s{2,})/g, '  ').length;
      return seatMapSeats > largestSeatMapSeats ? seatMap : largestSeatMap;
    }, cabin.seatMaps.seatMap[0]);
    return {
      cabinName: cabin.cabinName,
      seats: largestSeatMap.seats,
    };
  }

  private getLastRowNumberOfCabin(cabin) {
    const lastRow = cabin.seatMaps.seatMap[cabin.seatMaps.seatMap.length - 1].rowNumber;
    return lastRow;
  }
}
