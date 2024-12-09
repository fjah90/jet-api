import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { Formatter } from 'src/utils/xml.formatter';
import { GetBoardingPassDto, PostSendEmailDto } from '../dto/index';
import { CheckinRemoteRepository } from '../repositories';
import {
  formatNumber,
  formatDayOfYear,
  formatToNumberValid,
  generateFullName,
  flattenArray,
  unifyBoardingPasses,
  operatedBy,
} from '../utils/formatter';
import { generateBoardingPassString } from '../utils/converter';
import { GetBoardingPassResponse } from '../responsesDto/boarding-pass.dto';
import { PnrRemoteRepository } from 'src/pnr/pnr.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { StatusCode } from 'src/enums/status-codes.enum';
import { checkinStatusAvailables } from '../utils/dictonary';
import { modifyDate } from 'src/reservations/utils/dateModify';
import { StatsdService } from 'src/statsd/statsd.service';
import { CreateCheckinAgencyDto } from '../dto/create-checkin-agency.dto';
import { ReservationAgencyService } from 'src/reservations/reservation-agency.service';
import { ReservationAgencyRemoteRepository } from 'src/reservations/reservation-agency.remote-repository';
import { GetBoardingPassAgencyDto } from '../dto/get-boarding-pass-agency.dto';

@Injectable()
export class CheckinAgencyService {
  constructor(
    private authService: AuthService,
    private reservationService: ReservationAgencyService,
    private reservationRemoteRepository: ReservationAgencyRemoteRepository,
    private checkinRemoteRepository: CheckinRemoteRepository,
    private pnrRemoteRepository: PnrRemoteRepository,
    private jsonLogger: JsonLogger,
    private statsdService: StatsdService
  ) {}
  async createCheckin(createCheckinDto: CreateCheckinAgencyDto): Promise<HttpException> {
    try {
      const token = createCheckinDto.token;
      const { confirmationNumber } = createCheckinDto;

      const reservation = await this.reservationService.retrieveReservation(
        {
          confirmationNumber,
        },
        token,
        false,
        'Agency'
      );

      // Check PaymentStatus
      if (!reservation?.paymentStatus) return new HttpException('PaymentStatus is not true yet.', HttpStatus.CONFLICT);

      const { airlines } = this.availableResponseMapper(
        await this.reservationRemoteRepository.retrievePnr({ confirmationNumber, token }, 'Agency'),
        'RetrievePNRResponse',
        'RetrievePNRResult'
      );

      const logicalFlights = this.toArray(airlines['airline']['logicalFlight']['logicalFlight']);
      const logicalFlight = logicalFlights.find(({ key }) => key == createCheckinDto.logicalFlightKey);
      const physicalFlights = this.toArray(logicalFlight.physicalFlights.physicalFlight);
      const physicalFlight = physicalFlights.find(({ key }) => key == createCheckinDto.physicalFlightKey);
      const customerKey = physicalFlight.customers.customer.key;
      const airlinePersons = this.toArray(physicalFlight.customers.customer.airlinePersons.airlinePerson);
      const passengers = createCheckinDto.passengers.filter(({ airLinePersonKey }) => {
        const airlinePerson = airlinePersons.find(({ key }) => key == airLinePersonKey);

        if (!airlinePerson || parseInt(airlinePerson.PTCID) == 5) return false;

        return true;
      });

      const checkinResponse = await this.checkinRemoteRepository.createCheckin(
        {
          token,
          ...createCheckinDto,
          customerKey,
          passengers,
        },
        'Agency'
      );

      const exception = await this.jsonLogger.processException(checkinResponse, 'CheckInResponse', 'CheckInResult');

      if (exception.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(exception);
      }

      await this.pnrRemoteRepository.createPnr(token, 'SaveReservation', confirmationNumber, 'Agency');

      return new HttpException('Checkin successfully created.', HttpStatus.OK);
    } catch (error) {
      console.error(`[ERROR]: ${error}`);
    }
  }

  public async postSendEmail(postSendEmailDto: PostSendEmailDto, firebaseToken: string) {
    return this.availablePostSendEmailResponseMapper(
      await this.reservationService.getReservation(postSendEmailDto, firebaseToken)
    );
  }

  public async getBoardinPass(
    getBoardingPassDto: GetBoardingPassAgencyDto,
    user: string
  ): Promise<GetBoardingPassResponse[] | HttpException> {
    try {
      const token = getBoardingPassDto.token;
      const { confirmationNumber } = getBoardingPassDto;
      const reservation = this.availableResponseMapper(
        await this.reservationRemoteRepository.retrievePnr({ confirmationNumber, token }, user),
        'RetrievePNRResponse',
        'RetrievePNRResult'
      );

      if (!reservation.airlines) return new HttpException('Reservation not found', HttpStatus.NOT_FOUND);

      // extract airlines and hasTickets properties from reservation
      const { airlines, hasTickets } = reservation;

      let flights;

      // check if airlines.airline.logicalFlight property is an array or not
      if (Array.isArray(airlines['airline']['logicalFlight']['logicalFlight']))
        flights = airlines['airline']['logicalFlight']['logicalFlight'];
      else flights = [airlines['airline']['logicalFlight']['logicalFlight']];

      // unify boarding passes from multiple flights
      return unifyBoardingPasses(
        flights.map(
          ({
            origin,
            destination,

            departureDate,
            operatingCarrier,
            operatingFlightNumber,
            originDefaultTerminal,
            physicalFlights: physicalFlightsOfFlight,
          }) => {
            const dayOfYear = formatToNumberValid(formatDayOfYear(departureDate)); // format the date and get day information
            const physicalFlights = physicalFlightsOfFlight['physicalFlight'];
            const { gate } = physicalFlights;
            let passengers;
            const hoursToBeSubtracted = 1;
            // check if physicalFlights is an array or not
            if (!Array.isArray(physicalFlights)) {
              const airlinePersons = Formatter.forceArray(
                physicalFlights['customers']['customer']['airlinePersons']['airlinePerson']
              );
              passengers = airlinePersons.map((airlinePerson) => ({
                ...airlinePerson,
                departureTime: physicalFlights['departureTime'],
                boardingTime: modifyDate(physicalFlights['departureTime'], hoursToBeSubtracted, true)
                  .toISOString()
                  .split('.')[0],
              }));
            } else {
              // merge multiple physicalFlights
              passengers = flattenArray(
                physicalFlights.map((physicalFlight) => {
                  const airlinePersons = Formatter.forceArray(
                    physicalFlight['customers']['customer']['airlinePersons']['airlinePerson']
                  );

                  return airlinePersons.map((airlinePerson) => ({
                    ...airlinePerson,
                    departureTime: physicalFlights[0]['departureTime'],
                    boardingTime: modifyDate(physicalFlights[0]['departureTime'], hoursToBeSubtracted, true)
                      .toISOString()
                      .split('.')[0],
                  }));
                })
              );
            }

            // Check if the passengers is an array or not, generate boardingPass for each passenger of each flight
            if (Array.isArray(passengers)) {
              passengers = Array.isArray(passengers[0]) ? passengers[0] : passengers;
              const ageOfPassengers = passengers.map(({ age }) => age);
              return {
                boardingPass: passengers
                  .map(
                    ({
                      key,
                      firstName,
                      lastName,
                      middleName,
                      fareClassCode,
                      seatAssignments: { seatAssignment },
                      age,
                      lapChildID,
                      charges: { charge },
                      title,
                      resSegStatus,
                      departureTime,
                      boardingTime,
                    }) => {
                      if (
                        !checkinStatusAvailables.some(
                          (statusAvailable: number) => statusAvailable === parseInt(resSegStatus)
                        )
                      )
                        return null;

                      const { seat, rowNumber, boardingPassNumber } = seatAssignment;
                      let serviceBundle;

                      if (Array.isArray(charge)) {
                        const serviceBundleElement = charge.find(
                          ({ chargeComment, codeType }) =>
                            chargeComment.includes(codeType) && chargeComment.includes('Service Bundle')
                        );
                        serviceBundle = serviceBundleElement?.description;
                      }

                      let seatFormatted = `${formatToNumberValid(rowNumber)}${seat}`;
                      // If child passenger is affiliated with mentioned adult passenger, extract the seat value of adult.
                      if (Math.sign(lapChildID) != -1) {
                        const {
                          seatAssignments: { seatAssignment: seatAssignmentOfAdult },
                        } = passengers.find(({ personOrgID }) => lapChildID === personOrgID);

                        const { seat: seatOfAdult, rowNumber: rowNumberOfAdult } = seatAssignmentOfAdult;

                        seatFormatted = `${formatToNumberValid(rowNumberOfAdult)}${seatOfAdult}`;
                      }
                      // generate boarding pass string for individual passenger
                      return {
                        origin,
                        destination,
                        operatingFlightNumber: formatNumber(operatingFlightNumber),
                        confirmationNumber,
                        departureDate,
                        dayOfYear,
                        title,
                        key,
                        firstName,
                        lastName,
                        middleName,
                        seat: seatFormatted.includes('-') ? '    ' : seatFormatted,
                        boardingPassNumber: formatNumber(boardingPassNumber),
                        sequenceNumber: formatNumber(boardingPassNumber),
                        group: null,
                        operatedBy: operatedBy(operatingCarrier),
                        gate,
                        terminal: originDefaultTerminal,
                        flightOperator: operatingCarrier,
                        classOfPassenger: fareClassCode,
                        hasTickets,
                        age,
                        serviceBundle,
                        color: '#279989',
                        departureTime,
                        boardingTime,
                        boardingpass: generateBoardingPassString({
                          origin,
                          destination,
                          operatingFlightNumber: formatNumber(operatingFlightNumber),
                          confirmationNumber,
                          departureDate,
                          dayOfYear,
                          passengerName: generateFullName(firstName, lastName, middleName, title),
                          seat: seatFormatted.includes('-') ? '    ' : seatFormatted,
                          boardingPassNumber: formatNumber(boardingPassNumber),
                          flightOperator: operatingCarrier,
                          classOfPassenger: fareClassCode,
                          hasTickets,
                          age,
                          ageOfPassengers: ageOfPassengers.filter(
                            (ageOfOtherPassanger: number) => ageOfOtherPassanger !== age
                          ),
                        }),
                      };
                    }
                  )
                  .filter(Boolean),
              };
            }
          }
        )
      );
    } catch (error) {
      console.error(`[ERROR]: ${error}`);
    }
  }

  private toArray(obj) {
    if (Array.isArray(obj)) {
      return obj;
    } else {
      return [obj];
    }
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

  private availablePostSendEmailResponseMapper(reservationResponse: any) {
    const responseData = reservationResponse['s:Body']['RetrievePNRResponse']['RetrievePNRResult'];
    const stringToSearch = 'a:';
    const replacer = new RegExp(stringToSearch, 'g');
    const json = JSON.parse(JSON.stringify(responseData).replace(replacer, ''));
    const response = json.Exceptions['b:ExceptionInformation.Exception']['b:ExceptionDescription'];
    if (response !== 'Successful Transaction') return { message: 'Reservation not found' };
    const {
      ContactInfos: { ContactInfo },
    } = json;
    const { ContactField: email } = ContactInfo.find((contactInfoItem: any) => contactInfoItem.ContactType === '4');
    return { message: email };
  }

  private availableCreateCheckinResponseMapper(createCheckinResponse: any) {
    const responseData = createCheckinResponse['s:Body']['CheckInResponse']['CheckInResult'];
    const stringToSearch = 'a:';
    const replacer = new RegExp(stringToSearch, 'g');
    const json = JSON.parse(JSON.stringify(responseData).replace(replacer, ''));
    const exception = json.Exceptions['b:ExceptionInformation.Exception'];

    return {
      statusCode: Number(exception['b:ExceptionCode']),
      statusMessage: exception['b:ExceptionDescription'],
    };
  }
}
