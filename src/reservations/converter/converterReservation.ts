import * as moment from 'moment';
import { RetrieveReservationsDto } from '../dto/get-reservations.dto';
import { ReservationDto } from 'src/pnr/dto/reservation.dto';
import { CurrencySymbols } from 'src/prismic/utils/currencies';
import {
  modifyDate,
  hasDeparted,
  validateDate,
  isWithinFourHours,
  calculateRemainingMinutes,
} from '../utils/dateModify';
import { citiesAvailables } from '../utils/citiesAvailables';
import { getIdsFromOptionCode } from 'src/prismic/utils/options';
import { Person } from '../responsesDto/get-reservation.dto';
import { AirlinesValid } from 'src/fare-quotes/entities/airlines-valid.enum';
import { Formatter } from 'src/utils/xml.formatter';

const calculateCheckinCloseTime = (departureTime: string): string => {
  const departureFormat = 'YYYY-MM-DDTHH:mm:ss';
  const formattedDepartureTime: string = departureTime.slice(0, -1) + '-00:00';
  const departureDateTime: Date = moment.utc(formattedDepartureTime, departureFormat).toDate();
  const checkinCloseTime: Date = new Date(departureDateTime.getTime() - 4 * 60 * 60 * 1000);
  const formattedCheckinCloseTime: string = moment.utc(checkinCloseTime).format(departureFormat);
  return formattedCheckinCloseTime;
};

const hasAllowCheckin = (person: Person): boolean => {
  if (
    person &&
    parseInt(person.passengerTypeID) !== 5 &&
    person.firstName &&
    person.lastName &&
    person.country &&
    person.nationality &&
    person.dob &&
    person.issueCountry &&
    person.residenceCountry
  )
    return true;

  return false;
};

export const converterReservation = ({
  response,
  lastName,
  disableWebCheckinForSsrs,
  airports = [],
  airportImages = [],
  isLastNameRequired = true,
  apisInfo = [],
  packages = [],
  extras,
  prismicOptions,
}: {
  response: any;
  lastName: string;
  disableWebCheckinForSsrs: any;
  airports: any[];
  airportImages: any[];
  isLastNameRequired?: boolean;
  apisInfo?: any;
  packages?: any;
  extras?: any;
  prismicOptions: any;
}) => {
  // const FlightStatus = {
  //   '0': 'CANCELLED',
  //   '1': 'ACTIVE',
  //   '2': 'WAIT_LIST',
  //   '4': 'CHECKED_IN',
  //   '5': 'BOARDED',
  //   '9': 'NO_SHOW',
  // };

  let reservationStatus = 0;
  let firstFlightOfReservationStatus = 0;
  let secondFlightOfReservationStatus = 0;
  const flightInformation =
    response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline']['a:LogicalFlight'][
      'a:LogicalFlight'
    ];

  const flightsCount = Formatter.forceArray(flightInformation).length;
  const hasThreeOrMoreFlights = flightsCount >= 3;
  const todaysDate = response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:TodaysDate'];
  const reservationBalance = parseFloat(
    response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:ReservationBalance']
  );
  let firstFlightcheckinBlocked = false;
  let secondFlightcheckinBlocked = false;
  const flight = Array.isArray(flightInformation)
    ? flightInformation.length
      ? new Date(flightInformation[1]['a:DepartureTime']) < new Date(flightInformation[0]['a:DepartureTime'])
        ? flightInformation[1]
        : flightInformation[0]
      : undefined
    : flightInformation;
  const amountOfScalesFlight = flight['a:PhysicalFlights']['a:PhysicalFlight'].length - 1;

  const passengersList = amountOfScalesFlight
    ? flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
        'a:AirlinePerson'
      ]
    : response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline']['a:LogicalFlight'][
        'a:LogicalFlight'
      ][0]
    ? response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline']['a:LogicalFlight'][
        'a:LogicalFlight'
      ][0]['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']
    : response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline']['a:LogicalFlight'][
        'a:LogicalFlight'
      ]['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'];
  const confirmationNumber = response['s:Body']['RetrievePNRResponse']['RetrievePNRResult'];
  const confirmationKey = response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Key'];

  let parsedPersonalInformation = [];

  if (Array.isArray(passengersList)) {
    for (const passenger of passengersList) {
      const apiInfoElement = apisInfo.find((apiInfo) => {
        const apiInfoRecordNumber = parseInt(apiInfo['a:RecordNumber']);
        const passengerRecordNumber = parseInt(passenger['a:RecordNumber']);
        if (passengerRecordNumber != apiInfoRecordNumber) return false;

        if (
          apiInfo['a:PhysicalFlightID'] == Array.isArray(flight['a:PhysicalFlights']['a:PhysicalFlight'])
            ? flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:PhysicalFlightID']
            : flight['a:PhysicalFlights']['a:PhysicalFlight']['a:PhysicalFlightID'] &&
              parseInt(apiInfo['a:DocumentType1']) == 1
        )
          return true;
        return false;
      });
      if (!parsedPersonalInformation.some(({ personOrgID }) => personOrgID === passenger['a:PersonOrgID'])) {
        parsedPersonalInformation.push({
          show: calculateRemainingMinutes(
            modifyDate(
              flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
              parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
              true
            ).toString(),
            todaysDate
          ),
          personOrgID: passenger['a:PersonOrgID'],
          firstName: passenger['a:FirstName'],
          lastName: passenger['a:LastName'],
          resSegStatus: parseInt(passenger['a:ResSegStatus']),
          middleName: passenger['a:MiddleName'],
          age: passenger['a:Age'],
          dob: passenger['a:DOB'],
          fareBasisCode: passenger['a:FareBasisCode'],
          fareClassCode: passenger['a:FareClassCode'],
          passengerTypeID: passenger['a:PTCID'],
          gender: passenger['a:Gender'],
          title: passenger['a:Title'],
          country: passenger['a:Country'],
          passport: apiInfoElement?.['a:DocumentNumber'] || '',
          nationality: apiInfoElement?.['a:Citizenship'] || '',
          languageId: passenger['a:NationalityLaguageID'],
          address: passenger['a:Address'],
          address2: passenger['a:Address2'],
          city: passenger['a:City'],
          state: passenger['a:State'],
          postalCode: passenger['a:Postal'],
          expirationDate: apiInfoElement?.['a:ExpirationDate1'] || '',
          issueCountry: apiInfoElement?.['a:IssueCountry1'] || '',
          residenceCountry: apiInfoElement?.['a:ResidenceCountry'] || '',
          documentNumber: apiInfoElement?.['a:DocumentNumber'] || '',
        });
      }
    }
  } else {
    const apiInfo = apisInfo.find((apiInfo) => {
      const apiInfoRecordNumber = parseInt(apiInfo['a:RecordNumber']);
      const passengerRecordNumber = parseInt(passengersList['a:RecordNumber']);
      if (passengerRecordNumber != apiInfoRecordNumber) return false;

      if (
        apiInfo['a:PhysicalFlightID'] == Array.isArray(flight['a:PhysicalFlights']['a:PhysicalFlight'])
          ? flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:PhysicalFlightID']
          : flight['a:PhysicalFlights']['a:PhysicalFlight']['a:PhysicalFlightID'] &&
            parseInt(apiInfo['a:DocumentType1']) == 1
      )
        return true;
      return false;
    });
    parsedPersonalInformation.push({
      show: calculateRemainingMinutes(
        modifyDate(
          flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
          parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
          true
        ).toString(),
        todaysDate
      ),
      personOrgID: passengersList['a:PersonOrgID'],
      firstName: passengersList['a:FirstName'],
      lastName: passengersList['a:LastName'],
      middleName: passengersList['a:MiddleName'],
      age: passengersList['a:Age'],
      dob: passengersList['a:DOB'],
      resSegStatus: parseInt(passengersList['a:ResSegStatus']),
      passengerTypeID: passengersList['a:PTCID'],
      fareBasisCode: passengersList['a:FareBasisCode'],
      fareClassCode: passengersList['a:FareClassCode'],
      gender: passengersList['a:Gender'],
      title: passengersList['a:Title'],
      country: passengersList['a:Country'],
      passport: apiInfo?.['a:DocumentNumber'] || '',
      nationality: apiInfo?.['a:Citizenship'] || '',
      languageId: passengersList['a:NationalityLaguageID'],
      address: passengersList['a:Address'],
      address2: passengersList['a:Address2'],
      city: passengersList['a:City'],
      state: passengersList['a:State'],
      postalCode: passengersList['a:Postal'],
      expirationDate: apiInfo?.['a:ExpirationDate1'] || '',
      issueCountry: apiInfo?.['a:IssueCountry1'] || '',
      residenceCountry: apiInfo?.['a:ResidenceCountry'] || '',
      documentNumber: apiInfo?.['a:DocumentNumber'] || '',
    });
  }

  const returnFlight = Array.isArray(flightInformation)
    ? flightInformation.length
      ? new Date(flightInformation[1]['a:DepartureTime']) > new Date(flightInformation[0]['a:DepartureTime'])
        ? flightInformation[1]
        : flightInformation[0]
      : undefined
    : undefined;

  const amountOfScalesReturnFlight = returnFlight && returnFlight['a:PhysicalFlights']['a:PhysicalFlight'].length - 1;

  if (amountOfScalesFlight) {
    flight['a:PhysicalFlights']['a:PhysicalFlight'].map((item) => {
      if (!citiesAvailables.some((city) => city == item['a:Origin'])) firstFlightcheckinBlocked = true;
    });
  } else {
    if (!citiesAvailables.some((city) => city == flight['a:Origin'])) firstFlightcheckinBlocked = true;
  }

  if (returnFlight) {
    if (amountOfScalesReturnFlight) {
      returnFlight['a:PhysicalFlights']['a:PhysicalFlight'].map((item) => {
        if (!citiesAvailables.some((city) => city == item['a:Origin'])) secondFlightcheckinBlocked = true;
      });
    } else {
      if (!citiesAvailables.some((city) => city == returnFlight['a:Origin'])) secondFlightcheckinBlocked = true;
    }
  }

  const ScalesReturnFlight = returnFlight
    ? amountOfScalesReturnFlight
      ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight']
          .map((item) => {
            return {
              carrierCode: item['a:CarrierCode'],
              flightNumber: item['a:FlightNumber'],
              departureTime: item['a:DepartureTime'],
              hasDeparted: hasDeparted(
                modifyDate(item['a:DepartureTime'], parseInt(item['a:UTCDepartureOffset']), true).toString()
              ),
              // timeToCloseCheckIn: calculateCheckinCloseTime(item['a:DepartureTime']),
              arrivaltime: item['a:Arrivaltime'],
              flightDuration: item['a:FlightDuration'],
              destination: item['a:Destination'],
              destinationName: item['a:DestinationName'],
              origin: item['a:Origin'],
              originName: item['a:OriginName'],
              todaysDate: modifyDate(todaysDate, parseInt(item['a:UTCDepartureOffset']), false)
                .toISOString()
                .split('.')[0],
              utcDepartureOffSet: parseInt(item['a:UTCDepartureOffset']),
              originAirportName: airports.find(({ code }) => code == item['a:Origin'])?.name || '',
              destinationAirportName: airports.find(({ code }) => code == item['a:Destination'])?.name || '',
              destinationAirportImage:
                airportImages.find(({ title }) => title[0]?.text == item['a:Destination'])?.image?.url || '',
              // flightStatus:
              //   FlightStatus[
              //     item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:ResSegStatus']
              //   ],
              // checkinStatus:
              //   item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:CheckinStatus'],
              physicalFlightID: item['a:PhysicalFlightID'],
              checkinBlocked: secondFlightcheckinBlocked,
              customerKey: item['a:Customers']['a:Customer']['a:Key'],
              persons: Array.isArray(item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'])
                ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'].map((person) => {
                    return {
                      airLinePersonKey: person['a:Key'],
                      checkinStatus: !(parseInt(person['a:ResSegStatus']) === 1),
                      resSegStatus: parseInt(person['a:ResSegStatus']),
                      personOrgID: person['a:PersonOrgID'],
                      person: `${person['a:FirstName']}${person['a:MiddleName'] ?? ` ${person['a:MiddleName']}`} ${
                        person['a:LastName']
                      }`,
                      // openToCheckIn: parseInt(person['a:ResSegStatus']) === 1 ? true : false,
                      passengerTypeID: person['a:PTCID'],
                      allowCheckIn: hasAllowCheckin(
                        parsedPersonalInformation.find(({ personOrgID }) => personOrgID == person['a:PersonOrgID'])
                      ),
                      services: Array.isArray(person['a:Charges']['a:Charge'])
                        ? person['a:Charges']['a:Charge']
                            .filter((item) => item['a:IsSSR'] === 'true' && parseInt(item['a:ChargeStatus']) == 1)
                            .map((item) => {
                              if (disableWebCheckinForSsrs.some((ssr) => ssr == item['a:CodeType']))
                                secondFlightcheckinBlocked = true;

                              const prismicsIDs = getIdsFromOptionCode(item['a:CodeType'], extras);
                              const prismicOption = prismicOptions.find(
                                ({ ssrId, id: prismicOptionId }) =>
                                  ssrId === prismicsIDs?.extraId && prismicOptionId === prismicsIDs?.optionId
                              ); // Get the Prismic option based on ssrId, id, and prismicOptionId.
                              return {
                                code: item['a:CodeType'],
                                description: prismicOption?.title || item['a:Description'],
                                serviceID: '',
                                categoryID: '',
                              };
                            })
                        : [],
                      seatAssignmentKey: person['a:SeatAssignments']['a:SeatAssignment']['a:Key'],
                      seat:
                        person['a:SeatAssignments']['a:SeatAssignment'] &&
                        person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                          ? `${person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']}${person['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']}`
                          : '',
                      rowNumber:
                        person['a:SeatAssignments']['a:SeatAssignment'] &&
                        person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                          ? person['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']
                          : '',
                      seatNumber:
                        person['a:SeatAssignments']['a:SeatAssignment'] &&
                        person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                          ? person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                          : '',
                      oldSeat:
                        person['a:SeatAssignments']['a:SeatAssignment'] &&
                        person['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']
                          ? `${person['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']}${person['a:SeatAssignments']['a:SeatAssignment']['a:OldRowNumber']}`
                          : '',
                    };
                  })
                : [
                    {
                      airLinePersonKey:
                        item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:Key'],
                      checkinStatus: !(
                        parseInt(
                          item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:ResSegStatus']
                        ) === 1
                      ),
                      allowCheckIn: hasAllowCheckin(
                        parsedPersonalInformation.find(
                          ({ personOrgID }) =>
                            personOrgID ==
                            item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:PersonOrgID']
                        )
                      ),
                      personOrgID:
                        item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:PersonOrgID'],
                      person: `${
                        item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:FirstName']
                      }${
                        item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName'] ??
                        ` ${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName']}`
                      } ${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:LastName']}`,
                      resSegStatus: parseInt(
                        item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:ResSegStatus']
                      ),
                      passengerTypeID:
                        item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:PTCID'],
                      services: Array.isArray(
                        item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:Charges'][
                          'a:Charge'
                        ]
                      )
                        ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:Charges'][
                            'a:Charge'
                          ]
                            .filter((item) => item['a:IsSSR'] === 'true' && parseInt(item['a:ChargeStatus']) == 1)
                            .map((item) => {
                              if (disableWebCheckinForSsrs.some((ssr) => ssr == item['a:CodeType']))
                                secondFlightcheckinBlocked = true;
                              const prismicsIDs = getIdsFromOptionCode(item['a:CodeType'], extras);
                              const prismicOption = prismicOptions.find(
                                ({ ssrId, id: prismicOptionId }) =>
                                  ssrId === prismicsIDs?.extraId && prismicOptionId === prismicsIDs?.optionId
                              ); // Get the Prismic option based on ssrId, id, and prismicOptionId.
                              return {
                                code: item['a:CodeType'],
                                description: prismicOption?.title || item['a:Description'],
                                serviceID: '',
                                categoryID: '',
                              };
                            })
                        : [],
                      seatAssignmentKey:
                        item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments'][
                          'a:SeatAssignment'
                        ]['a:Key'],
                      seat: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'][
                        'a:SeatAssignments'
                      ]['a:SeatAssignment']['a:Seat']
                        ? `${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']}${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']}`
                        : '',
                      rowNumber: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'][
                        'a:SeatAssignments'
                      ]['a:SeatAssignment']['a:Seat']
                        ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments'][
                            'a:SeatAssignment'
                          ]['a:RowNumber']
                        : '',
                      seatNumber: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'][
                        'a:SeatAssignments'
                      ]['a:SeatAssignment']['a:Seat']
                        ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments'][
                            'a:SeatAssignment'
                          ]['a:Seat']
                        : '',
                      oldSeat: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'][
                        'a:SeatAssignments'
                      ]['a:SeatAssignment']['a:OldSeat']
                        ? `${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']}${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldRowNumber']}`
                        : '',
                    },
                  ],
            };
          })
          .sort((flightOne, flightTwo) => {
            if (moment(flightOne.departureTime).isBefore(flightTwo.departureTime)) return -1;
            if (moment(flightOne.departureTime).isAfter(flightTwo.departureTime)) return 1;
            return 0;
          })
      : [
          {
            carrierCode: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:CarrierCode'],
            flightNumber: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:FlightNumber'],
            departureTime: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
            arrivaltime: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Arrivaltime'],
            flightDuration: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:FlightDuration'],
            destination: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Destination'],
            hasDeparted: hasDeparted(
              modifyDate(
                returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
                parseInt(returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
                true
              ).toString()
            ),
            // timeToCloseCheckIn: calculateCheckinCloseTime(
            //   returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime']
            // ),
            destinationName: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:DestinationName'],
            origin: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Origin'],
            originName: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:OriginName'],
            originAirportName:
              airports.find(({ code }) => code == returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Origin'])
                ?.name || '',
            destinationAirportName:
              airports.find(
                ({ code }) => code == returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Destination']
              )?.name || '',
            destinationAirportImage:
              airportImages.find(
                ({ title }) => title[0]?.text == returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Destination']
              )?.image?.url || '',
            // flightStatus:
            //   FlightStatus[
            //     returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
            //       'a:AirlinePerson'
            //     ]['a:ResSegStatus']
            //   ],
            // checkinStatus:
            //   returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
            //     'a:AirlinePerson'
            //   ]['a:CheckinStatus'],
            physicalFlightID: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:PhysicalFlightID'],
            checkinBlocked: secondFlightcheckinBlocked,
            customerKey: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:Key'],
            persons: Array.isArray(
              returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ]
            )
              ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                  'a:AirlinePerson'
                ].map((person) => {
                  return {
                    airLinePersonKey: person['a:Key'],
                    checkinStatus: !(parseInt(person['a:ResSegStatus']) === 1),
                    personOrgID: person['a:PersonOrgID'],
                    person: `${person['a:FirstName']}${person['a:MiddleName'] ?? ` ${person['a:MiddleName']}`} ${
                      person['a:LastName']
                    }`,
                    resSegStatus: parseInt(person['a:ResSegStatus']),
                    passengerTypeID: person['a:PTCID'],
                    allowCheckIn: hasAllowCheckin(
                      parsedPersonalInformation.find(({ personOrgID }) => personOrgID == person['a:PersonOrgID'])
                    ),
                    // openToCheckIn: parseInt(person['a:ResSegStatus']) === 1 ? true : false,
                    services: Array.isArray(person['a:Charges']['a:Charge'])
                      ? person['a:Charges']['a:Charge']
                          .filter((item) => item['a:IsSSR'] === 'true' && parseInt(item['a:ChargeStatus']) == 1)
                          .map((item) => {
                            if (disableWebCheckinForSsrs.some((ssr) => ssr == item['a:CodeType']))
                              secondFlightcheckinBlocked = true;
                            const prismicsIDs = getIdsFromOptionCode(item['a:CodeType'], extras);
                            const prismicOption = prismicOptions.find(
                              ({ ssrId, id: prismicOptionId }) =>
                                ssrId === prismicsIDs?.extraId && prismicOptionId === prismicsIDs?.optionId
                            ); // Get the Prismic option based on ssrId, id, and prismicOptionId.
                            return {
                              code: item['a:CodeType'],
                              description: prismicOption?.title || item['a:Description'],
                              serviceID: '',
                              categoryID: '',
                            };
                          })
                      : [],
                    seatAssignmentKey: person['a:SeatAssignments']['a:SeatAssignment']['a:Key'],
                    seat: person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                      ? `${person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']}${person['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']}`
                      : '',
                    rowNumber: person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                      ? person['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']
                      : '',
                    seatNumber: person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                      ? person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                      : '',
                    oldSeat: person['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']
                      ? `${person['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']}${person['a:SeatAssignments']['a:SeatAssignment']['a:OldRowNumber']}`
                      : '',
                  };
                })
              : [
                  {
                    airLinePersonKey:
                      returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                        'a:AirlinePersons'
                      ]['a:AirlinePerson']['a:Key'],
                    checkinStatus: !(
                      parseInt(
                        returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                          'a:AirlinePersons'
                        ]['a:AirlinePerson']['a:ResSegStatus']
                      ) === 1
                    ),
                    personOrgID:
                      returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                        'a:AirlinePersons'
                      ]['a:AirlinePerson']['a:PersonOrgID'],
                    person: `${
                      returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                        'a:AirlinePersons'
                      ]['a:AirlinePerson']['a:FirstName']
                    }${
                      returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                        'a:AirlinePersons'
                      ]['a:AirlinePerson']['a:MiddleName'] ??
                      ` ${returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName']}`
                    } ${
                      returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                        'a:AirlinePersons'
                      ]['a:AirlinePerson']['a:LastName']
                    }`,
                    resSegStatus: parseInt(
                      returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                        'a:AirlinePersons'
                      ]['a:AirlinePerson']['a:ResSegStatus']
                    ),
                    passengerTypeID:
                      returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                        'a:AirlinePersons'
                      ]['a:AirlinePerson']['a:PTCID'],
                    allowCheckIn: hasAllowCheckin(
                      parsedPersonalInformation.find(
                        ({ personOrgID }) =>
                          personOrgID ==
                          returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                            'a:AirlinePersons'
                          ]['a:AirlinePerson']['a:PersonOrgID']
                      )
                    ),
                    services: Array.isArray(
                      returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                        'a:AirlinePersons'
                      ]['a:AirlinePerson']['a:Charges']['a:Charge']
                    )
                      ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                          'a:AirlinePersons'
                        ]['a:AirlinePerson']['a:Charges']['a:Charge']
                          .filter((item) => item['a:IsSSR'] === 'true' && parseInt(item['a:ChargeStatus']) == 1)
                          .map((item) => {
                            if (disableWebCheckinForSsrs.some((ssr) => ssr == item['a:CodeType']))
                              secondFlightcheckinBlocked = true;
                            const prismicsIDs = getIdsFromOptionCode(item['a:CodeType'], extras);
                            const prismicOption = prismicOptions.find(
                              ({ ssrId, id: prismicOptionId }) =>
                                ssrId === prismicsIDs?.extraId && prismicOptionId === prismicsIDs?.optionId
                            ); // Get the Prismic option based on ssrId, id, and prismicOptionId.
                            return {
                              code: item['a:CodeType'],
                              description: prismicOption?.title || item['a:Description'],
                              serviceID: '',
                              categoryID: '',
                            };
                          })
                      : [],
                    seatAssignmentKey:
                      returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                        'a:AirlinePersons'
                      ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Key'],
                    seat: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                      'a:AirlinePersons'
                    ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                      ? `${returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']}${returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']}`
                      : '',
                    rowNumber: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                      'a:AirlinePersons'
                    ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                      ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                          'a:AirlinePersons'
                        ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']
                      : '',
                    seatNumber: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                      'a:AirlinePersons'
                    ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                      ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                          'a:AirlinePersons'
                        ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                      : '',
                    oldSeat: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                      'a:AirlinePersons'
                    ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']
                      ? `${returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']}${returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldRowNumber']}`
                      : '',
                  },
                ],
          },
        ]
    : [];

  const ScalesFlight = amountOfScalesFlight
    ? flight['a:PhysicalFlights']['a:PhysicalFlight']
        .map((item) => {
          return {
            carrierCode: item['a:CarrierCode'],
            flightNumber: item['a:FlightNumber'],
            departureTime: item['a:DepartureTime'],
            arrivaltime: item['a:Arrivaltime'],
            hasDeparted: hasDeparted(
              modifyDate(item['a:DepartureTime'], parseInt(item['a:UTCDepartureOffset']), true).toString()
            ),
            // timeToCloseCheckIn: calculateCheckinCloseTime(item['a:DepartureTime']),
            flightDuration: item['a:FlightDuration'],
            destination: item['a:Destination'],
            destinationName: item['a:DestinationName'],
            origin: item['a:Origin'],
            originName: item['a:OriginName'],
            originAirportName: airports.find(({ code }) => code == item['a:Origin'])?.name || '',
            destinationAirportName: airports.find(({ code }) => code == item['a:Destination'])?.name || '',
            destinationAirportImage:
              airportImages.find(({ title }) => title[0]?.text == item['a:Destination'])?.image?.url || '',
            // flightStatus:
            //   FlightStatus[item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:ResSegStatus']],
            // checkinStatus: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:CheckinStatus'],
            physicalFlightID: item['a:PhysicalFlightID'],
            checkinBlocked: firstFlightcheckinBlocked,
            customerKey: item['a:Customers']['a:Customer']['a:Key'],
            persons: Array.isArray(item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'])
              ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'].map((person) => {
                  return {
                    airLinePersonKey: person['a:Key'],
                    checkinStatus: !(parseInt(person['a:ResSegStatus']) === 1),
                    personOrgID: person['a:PersonOrgID'],
                    person: `${person['a:FirstName']}${person['a:MiddleName'] ?? ` ${person['a:MiddleName']}`} ${
                      person['a:LastName']
                    }`,
                    resSegStatus: parseInt(person['a:ResSegStatus']),
                    allowCheckIn: hasAllowCheckin(
                      parsedPersonalInformation.find(({ personOrgID }) => personOrgID == person['a:PersonOrgID'])
                    ),
                    // openToCheckIn: parseInt(person['a:ResSegStatus']) === 1 ? true : false,
                    services: Array.isArray(person['a:Charges']['a:Charge'])
                      ? person['a:Charges']['a:Charge']
                          .filter((charge) => charge['a:IsSSR'] === 'true')
                          .map((item) => {
                            if (disableWebCheckinForSsrs.some((ssr) => ssr == item['a:CodeType']))
                              firstFlightcheckinBlocked = true;
                            const prismicsIDs = getIdsFromOptionCode(item['a:CodeType'], extras);
                            const prismicOption = prismicOptions.find(
                              ({ ssrId, id: prismicOptionId }) =>
                                ssrId === prismicsIDs?.extraId && prismicOptionId === prismicsIDs?.optionId
                            ); // Get the Prismic option based on ssrId, id, and prismicOptionId.
                            return {
                              code: item['a:CodeType'],
                              description: prismicOption?.title || item['a:Description'],
                              serviceID: '',
                              categoryID: '',
                            };
                          })
                      : [],
                    seatAssignmentKey: person['a:SeatAssignments']?.['a:SeatAssignment']?.['a:Key'],
                    seat:
                      person['a:SeatAssignments']['a:SeatAssignment'] &&
                      person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                        ? `${person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']}${person['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']}`
                        : '',
                    rowNumber:
                      person['a:SeatAssignments']['a:SeatAssignment'] &&
                      person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                        ? person['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']
                        : '',
                    seatNumber:
                      person['a:SeatAssignments']['a:SeatAssignment'] &&
                      person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                        ? person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                        : '',
                    oldSeat:
                      person['a:SeatAssignments']['a:SeatAssignment'] &&
                      person['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']
                        ? `${person['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']}${person['a:SeatAssignments']['a:SeatAssignment']['a:OldRowNumber']}`
                        : '',
                  };
                })
              : [
                  {
                    airLinePersonKey: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:Key'],
                    checkinStatus: !(
                      parseInt(
                        item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:ResSegStatus']
                      ) === 1
                    ),
                    personOrgID:
                      item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:PersonOrgID'],
                    person: `${
                      item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:FirstName']
                    }${
                      item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName'] ??
                      ` ${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName']}`
                    } ${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:LastName']}`,
                    resSegStatus: parseInt(
                      item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:ResSegStatus']
                    ),
                    passengerTypeID:
                      item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:PTCID'],
                    allowCheckIn: hasAllowCheckin(
                      parsedPersonalInformation.find(
                        ({ personOrgID }) =>
                          personOrgID ==
                          item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:PersonOrgID']
                      )
                    ),
                    services: Array.isArray(
                      item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:Charges']['a:Charge']
                    )
                      ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:Charges'][
                          'a:Charge'
                        ]
                          .filter((item) => item['a:IsSSR'] === 'true' && parseInt(item['a:ChargeStatus']) == 1)
                          .map((item) => {
                            if (disableWebCheckinForSsrs.some((ssr) => ssr == item['a:CodeType']))
                              firstFlightcheckinBlocked = true;
                            const prismicsIDs = getIdsFromOptionCode(item['a:CodeType'], extras);
                            const prismicOption = prismicOptions.find(
                              ({ ssrId, id: prismicOptionId }) =>
                                ssrId === prismicsIDs?.extraId && prismicOptionId === prismicsIDs?.optionId
                            ); // Get the Prismic option based on ssrId, id, and prismicOptionId.
                            return {
                              code: item['a:CodeType'],
                              description: prismicOption?.title || item['a:Description'],
                              serviceID: '',
                              categoryID: '',
                            };
                          })
                      : [],
                    seatAssignmentKey:
                      item['a:Customers']?.['a:Customer']?.['a:AirlinePersons']?.['a:AirlinePerson']?.[
                        'a:SeatAssignments'
                      ]?.['a:SeatAssignment']?.['a:Key'],
                    seat: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments'][
                      'a:SeatAssignment'
                    ]['a:Seat']
                      ? `${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']}${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']}`
                      : '',
                    rowNumber: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'][
                      'a:SeatAssignments'
                    ]['a:SeatAssignment']['a:Seat']
                      ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments'][
                          'a:SeatAssignment'
                        ]['a:RowNumber']
                      : '',
                    seatNumber: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'][
                      'a:SeatAssignments'
                    ]['a:SeatAssignment']['a:Seat']
                      ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments'][
                          'a:SeatAssignment'
                        ]['a:Seat']
                      : '',
                    oldSeat: item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'][
                      'a:SeatAssignments'
                    ]['a:SeatAssignment']['a:OldSeat']
                      ? `${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']}${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldRowNumber']}`
                      : '',
                  },
                ],
          };
        })
        .sort((flightOne, flightTwo) => {
          if (moment(flightOne.departureTime).isBefore(flightTwo.departureTime)) return -1;
          if (moment(flightOne.departureTime).isAfter(flightTwo.departureTime)) return 1;
          return 0;
        })
    : [
        {
          carrierCode: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:CarrierCode'],
          flightNumber: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:FlightNumber'],
          departureTime: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
          hasDeparted: hasDeparted(
            modifyDate(
              flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
              parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
              true
            ).toString()
          ),
          // timeToCloseCheckIn: calculateCheckinCloseTime(
          //   flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime']
          // ),
          arrivaltime: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Arrivaltime'],
          flightDuration: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:FlightDuration'],
          destination: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Destination'],
          destinationName: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DestinationName'],
          origin: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Origin'],
          originName: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:OriginName'],
          originAirportName:
            airports.find(({ code }) => code == flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Origin'])?.name ||
            '',
          destinationAirportName:
            airports.find(({ code }) => code == flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Destination'])
              ?.name || '',
          destinationAirportImage:
            airportImages.find(
              ({ title }) => title[0]?.text == flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Destination']
            )?.image?.url || '',
          // flightStatus:
          //   FlightStatus[
          //     flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
          //       'a:AirlinePerson'
          //     ]['a:ResSegStatus']
          //   ],
          // checkinStatus:
          //   flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
          //     'a:AirlinePerson'
          //   ]['a:CheckinStatus'],
          physicalFlightID: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:PhysicalFlightID'],
          checkinBlocked: firstFlightcheckinBlocked,
          customerKey: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:Key'],
          persons: Array.isArray(
            flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ]
          )
            ? flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ].map((person) => {
                return {
                  airLinePersonKey: person['a:Key'],
                  checkinStatus: !(parseInt(person['a:ResSegStatus']) === 1),
                  personOrgID: person['a:PersonOrgID'],
                  person: `${person['a:FirstName']}${person['a:MiddleName'] ?? ` ${person['a:MiddleName']}`} ${
                    person['a:LastName']
                  }`,
                  resSegStatus: parseInt(person['a:ResSegStatus']),
                  passengerTypeID: person['a:PTCID'],
                  allowCheckIn: hasAllowCheckin(
                    parsedPersonalInformation.find(({ personOrgID }) => personOrgID == person['a:PersonOrgID'])
                  ),
                  // openToCheckIn: parseInt(person['a:ResSegStatus']) === 1 ? true : false,
                  services: Array.isArray(person['a:Charges']['a:Charge'])
                    ? person['a:Charges']['a:Charge']
                        .filter((item) => item['a:IsSSR'] === 'true' && parseInt(item['a:ChargeStatus']) == 1)
                        .map((item) => {
                          if (disableWebCheckinForSsrs.some((ssr) => ssr == item['a:CodeType']))
                            firstFlightcheckinBlocked = true;
                          const prismicsIDs = getIdsFromOptionCode(item['a:CodeType'], extras);
                          const prismicOption = prismicOptions.find(
                            ({ ssrId, id: prismicOptionId }) =>
                              ssrId === prismicsIDs?.extraId && prismicOptionId === prismicsIDs?.optionId
                          ); // Get the Prismic option based on ssrId, id, and prismicOptionId.
                          return {
                            code: item['a:CodeType'],
                            description: prismicOption?.title || item['a:Description'],
                            serviceID: '',
                            categoryID: '',
                          };
                        })
                    : [],
                  seatAssignmentKey: person['a:SeatAssignments']['a:SeatAssignment']['a:Key'],
                  seat: person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                    ? `${person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']}${person['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']}`
                    : '',
                  rowNumber: person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                    ? person['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']
                    : '',
                  seatNumber: person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                    ? person['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                    : '',
                  oldSeat: person['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']
                    ? `${person['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']}${person['a:SeatAssignments']['a:SeatAssignment']['a:OldRowNumber']}`
                    : '',
                };
              })
            : [
                {
                  airLinePersonKey:
                    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                      'a:AirlinePerson'
                    ]['a:Key'],
                  checkinStatus: !(
                    parseInt(
                      flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                        'a:AirlinePerson'
                      ]['a:ResSegStatus']
                    ) === 1
                  ),
                  personOrgID:
                    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                      'a:AirlinePerson'
                    ]['a:PersonOrgID'],
                  person: `${
                    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                      'a:AirlinePerson'
                    ]['a:FirstName']
                  }${
                    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                      'a:AirlinePerson'
                    ]['a:MiddleName'] ??
                    ` ${flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName']}`
                  } ${
                    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                      'a:AirlinePerson'
                    ]['a:LastName']
                  }`,
                  resSegStatus: parseInt(
                    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                      'a:AirlinePerson'
                    ]['a:ResSegStatus']
                  ),
                  passengerTypeID:
                    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                      'a:AirlinePerson'
                    ]['a:PTCID'],
                  allowCheckIn: hasAllowCheckin(
                    parsedPersonalInformation.find(
                      ({ personOrgID }) =>
                        personOrgID ==
                        flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                          'a:AirlinePersons'
                        ]['a:AirlinePerson']['a:PersonOrgID']
                    )
                  ),
                  services: Array.isArray(
                    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                      'a:AirlinePerson'
                    ]['a:Charges']['a:Charge']
                  )
                    ? flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                        'a:AirlinePerson'
                      ]['a:Charges']['a:Charge']
                        .filter((item) => item['a:IsSSR'] === 'true' && parseInt(item['a:ChargeStatus']) == 1)
                        .map((item) => {
                          if (disableWebCheckinForSsrs.some((ssr) => ssr == item['a:CodeType']))
                            firstFlightcheckinBlocked = true;
                          const prismicsIDs = getIdsFromOptionCode(item['a:CodeType'], extras);
                          const prismicOption = prismicOptions.find(
                            ({ ssrId, id: prismicOptionId }) =>
                              ssrId === prismicsIDs?.extraId && prismicOptionId === prismicsIDs?.optionId
                          ); // Get the Prismic option based on ssrId, id, and prismicOptionId.
                          return {
                            code: item['a:CodeType'],
                            description: prismicOption?.title || item['a:Description'],
                            serviceID: '',
                            categoryID: '',
                          };
                        })
                    : [],
                  seatAssignmentKey:
                    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                      'a:AirlinePerson'
                    ]['a:SeatAssignments']['a:SeatAssignment']['a:Key'],
                  seat: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                    'a:AirlinePersons'
                  ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                    ? `${flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']}${flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']}`
                    : '',
                  rowNumber: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                    'a:AirlinePersons'
                  ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                    ? flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                        'a:AirlinePerson'
                      ]['a:SeatAssignments']['a:SeatAssignment']['a:RowNumber']
                    : '',
                  seatNumber: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                    'a:AirlinePersons'
                  ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                    ? flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                        'a:AirlinePerson'
                      ]['a:SeatAssignments']['a:SeatAssignment']['a:Seat']
                    : '',
                  oldSeat: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                    'a:AirlinePersons'
                  ]['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']
                    ? `${flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldSeat']}${flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:SeatAssignments']['a:SeatAssignment']['a:OldRowNumber']}`
                    : '',
                },
              ],
        },
      ];

  if (
    isLastNameRequired &&
    !parsedPersonalInformation.some((passenger) => passenger.lastName.replace(/\s/g, '') === lastName)
  )
    return null;

  const oneWayOpenToCheckIn = validateDate(
    modifyDate(
      flight['a:DepartureTime'],
      parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
      true
    ),
    response['s:Body'].RetrievePNRResponse.RetrievePNRResult['a:TodaysDate']
  );
  const returnFlightOpenToCheckIn = returnFlight
    ? validateDate(
        modifyDate(
          returnFlight['a:DepartureTime'],
          parseInt(returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
          true
        ),
        response['s:Body'].RetrievePNRResponse.RetrievePNRResult['a:TodaysDate']
      )
    : undefined;

  const flights = [];

  const airlinePerson = Array.isArray(flight['a:PhysicalFlights']['a:PhysicalFlight'])
    ? Array.isArray(
        flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
          'a:AirlinePerson'
        ]
      )
      ? flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
          'a:AirlinePerson'
        ][0]
      : flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
          'a:AirlinePerson'
        ]
    : Array.isArray(
        flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
          'a:AirlinePerson'
        ]
      )
    ? flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
        'a:AirlinePerson'
      ][0]
    : flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
        'a:AirlinePerson'
      ];

  let firstFlightStatus = false;
  let firstFlightShowMessage = false;
  for (const scale of ScalesFlight) {
    if (
      scale.persons.some((person) => {
        if (person.checkinStatus) {
          const passengerIndex = parsedPersonalInformation.findIndex(
            ({ personOrgID }) => personOrgID == person.personOrgID
          );
          parsedPersonalInformation[passengerIndex]['show'] = false;
        }
        if (!person.checkinStatus) {
          return true;
        }
        return false;
      })
    )
      firstFlightStatus = true;
    if (
      scale.persons.every((person) => person.checkinStatus) ||
      hasDeparted(
        modifyDate(
          flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
          parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
          true
        ).toString()
      ) ||
      isWithinFourHours(
        modifyDate(
          flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
          parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
          true
        ),
        modifyDate(todaysDate, parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']), false)
      )
    )
      firstFlightShowMessage = true;

    if (!scale.persons.every((person) => !person.resSegStatus)) {
      if (scale.persons.every((person) => person.resSegStatus && !hasThreeOrMoreFlights)) {
        firstFlightOfReservationStatus = 1;
        reservationStatus = 1;
        parsedPersonalInformation = parsedPersonalInformation.map((person) => {
          const showPassenger = person.resSegStatus === 1;
          return { ...person, show: showPassenger };
        });
      } else if (scale.persons.some((person) => person.resSegStatus) && !hasThreeOrMoreFlights) {
        firstFlightOfReservationStatus = 1;
        reservationStatus = 1;
        parsedPersonalInformation = parsedPersonalInformation.filter((person) => person.resSegStatus);
        scale.persons = scale.persons.filter((person) => person.resSegStatus);
      }
    } else if (flightsCount == 1) firstFlightOfReservationStatus = 1;
  }

  if (firstFlightOfReservationStatus)
    flights.push({
      availableToCheckIn:
        reservationBalance == 0 &&
        firstFlightStatus &&
        (Array.isArray(response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Payments']['a:Payment'])
          ? response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Payments']['a:Payment'].some(
              (transaction) => Number(transaction['a:TransactionStatus']) != 0
            )
          : Number(
              response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']?.['a:Payments']?.['a:Payment']?.[
                'a:TransactionStatus'
              ]
            ) != 0) &&
        oneWayOpenToCheckIn &&
        !firstFlightcheckinBlocked &&
        (Array.isArray(
          response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline']['a:LogicalFlight'][
            'a:LogicalFlight'
          ]
        )
          ? response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline'][
              'a:LogicalFlight'
            ]['a:LogicalFlight'].every((flight) =>
              AirlinesValid.some((airlineValid: string) => airlineValid == flight['a:OperatingCarrier'])
            )
          : AirlinesValid.some(
              (airlineValid: string) =>
                airlineValid ==
                response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline'][
                  'a:LogicalFlight'
                ]['a:LogicalFlight']['a:OperatingCarrier']
            )),
      logicalFlightKey: flight['a:Key'],
      physicalFlightKey: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Key'],
      logicalFlightID: flight['a:LogicalFlightID'],
      checkinBlocked: firstFlightcheckinBlocked,
      departureDate: flight['a:DepartureDate'],
      // photo: 'https://digittal.es/imageToBeReplaced.svg',
      // flightStatus: FlightStatus[flightStatus],
      // checkinStatus: flightCheckinStatus,
      hasDeparted: Formatter.forceArray(flight['a:PhysicalFlights']['a:PhysicalFlight']).some((scale) =>
        hasDeparted(modifyDate(scale['a:DepartureTime'], parseInt(scale['a:UTCDepartureOffset']), true).toString())
      ),
      packageInfo: packages.find(({ name }) => name == String(airlinePerson['a:WebFareType']).split(':')[1]) || {},
      timeToCloseCheckIn: calculateCheckinCloseTime(flight['a:DepartureTime']),
      operatingCarrier: flight['a:OperatingCarrier'],
      operatingFlightNumber: flight['a:OperatingFlightNumber'],
      origin: flight['a:Origin'],
      originName: flight['a:OriginName'],
      showMessage: firstFlightShowMessage || !reservationStatus,
      todaysDate: modifyDate(
        todaysDate,
        parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
        false
      )
        .toISOString()
        .split('.')[0],
      utcDepartureOffSet: parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
      destination: flight['a:Destination'],
      destinationName: flight['a:DestinationName'],
      originAirportName: airports.find(({ code }) => code == flight['a:Origin'])?.name || '',
      destinationAirportName: airports.find(({ code }) => code == flight['a:Destination'])?.name || '',
      destinationAirportImage:
        airportImages.find(({ title }) => title[0]?.text == flight['a:Destination'])?.image?.url || '',
      departureTime: flight['a:DepartureTime'],
      arrivalTime: flight['a:Arrivaltime'],
      amountOfScales: amountOfScalesFlight || 0,
      flights: ScalesFlight,
      fareBasisCode: Array.isArray(flight['a:PhysicalFlights']['a:PhysicalFlight'])
        ? Array.isArray(
            flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ]
          )
          ? flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ][0]['a:FareBasisCode']
          : flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ]['a:FareBasisCode']
        : Array.isArray(
            flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ]
          )
        ? flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
            'a:AirlinePerson'
          ][0]['a:FareBasisCode']
        : flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
            'a:AirlinePerson'
          ]['a:FareBasisCode'],

      fareClassCode: Array.isArray(flight['a:PhysicalFlights']['a:PhysicalFlight'])
        ? Array.isArray(
            flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ]
          )
          ? flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ][0]['a:FareClassCode']
          : flight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ]['a:FareClassCode']
        : Array.isArray(
            flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ]
          )
        ? flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
            'a:AirlinePerson'
          ][0]['a:FareClassCode']
        : flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
            'a:AirlinePerson'
          ]['a:FareClassCode'],
    });

  if (returnFlight) {
    let secondFlightStatus = false;
    let secondFlightShowMessage = false;
    for (const scale of ScalesReturnFlight) {
      if (!scale.persons.every((person) => !person.resSegStatus))
        if (scale.persons.every((person) => person.resSegStatus) && !hasThreeOrMoreFlights) {
          secondFlightOfReservationStatus = 1;
          reservationStatus = 1;
          parsedPersonalInformation = parsedPersonalInformation.map((person) => {
            const showPassenger = person.resSegStatus === 1;
            return { ...person, show: showPassenger };
          });
        } else if (scale.persons.some((person) => person.resSegStatus) && !hasThreeOrMoreFlights) {
          secondFlightOfReservationStatus = 1;
          reservationStatus = 1;
          parsedPersonalInformation = parsedPersonalInformation.filter((person) => person.resSegStatus);
          scale.persons = scale.persons.filter((person) => person.resSegStatus);
        }
      if (
        scale.persons.some((person) => {
          if (person.checkinStatus && secondFlightOfReservationStatus) {
            const passengerIndex = parsedPersonalInformation.findIndex(
              ({ personOrgID }) => personOrgID == person.personOrgID
            );
            parsedPersonalInformation[passengerIndex]['show'] = false;
          }
          if (!person.checkinStatus) {
            return true;
          }
          return false;
        })
      )
        secondFlightStatus = true;
      if (
        scale.persons.every((person) => person.checkinStatus) ||
        hasDeparted(
          modifyDate(
            returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
            parseInt(returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
            true
          ).toString()
        ) ||
        isWithinFourHours(
          modifyDate(
            flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
            parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
            true
          ),
          modifyDate(
            todaysDate,
            parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
            false
          )
        )
      )
        secondFlightShowMessage = true;
    }

    const airlinePerson = Array.isArray(returnFlight['a:PhysicalFlights']['a:PhysicalFlight'])
      ? Array.isArray(
          returnFlight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
            'a:AirlinePerson'
          ]
        )
        ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
            'a:AirlinePerson'
          ][0]
        : returnFlight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
            'a:AirlinePerson'
          ]
      : Array.isArray(
          returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
            'a:AirlinePerson'
          ]
        )
      ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
          'a:AirlinePerson'
        ][0]
      : returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
          'a:AirlinePerson'
        ];

    if (secondFlightOfReservationStatus)
      flights.push({
        availableToCheckIn:
          reservationBalance == 0 &&
          secondFlightStatus &&
          (Array.isArray(response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Payments']['a:Payment'])
            ? response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Payments']['a:Payment'].some(
                (transaction) => Number(transaction['a:TransactionStatus']) != 0
              )
            : Number(
                response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Payments']?.['a:Payment']?.[
                  'a:TransactionStatus'
                ]
              ) != 0) &&
          returnFlightOpenToCheckIn &&
          !secondFlightcheckinBlocked &&
          (Array.isArray(
            response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline'][
              'a:LogicalFlight'
            ]['a:LogicalFlight']
          )
            ? response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline'][
                'a:LogicalFlight'
              ]['a:LogicalFlight'].every((flight) =>
                AirlinesValid.some((airlineValid: string) => airlineValid == flight['a:OperatingCarrier'])
              )
            : AirlinesValid.some(
                (airlineValid: string) =>
                  airlineValid ==
                  response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline'][
                    'a:LogicalFlight'
                  ]['a:LogicalFlight']['a:OperatingCarrier']
              )),
        logicalFlightKey: returnFlight['a:Key'],
        physicalFlightKey: returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Key'],
        logicalFlightID: returnFlight['a:LogicalFlightID'],
        checkinBlocked: secondFlightcheckinBlocked,
        todaysDate: modifyDate(
          todaysDate,
          parseInt(returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
          false
        )
          .toISOString()
          .split('.')[0],
        utcDepartureOffSet: parseInt(returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
        departureDate: returnFlight['a:DepartureDate'],
        // photo: 'https://digittal.es/imageToBeReplaced.svg',
        // flightStatus: FlightStatus[returnFlightStatus],
        // checkinStatus: returnFlightCheckinStatus,
        hasDeparted: Formatter.forceArray(returnFlight['a:PhysicalFlights']['a:PhysicalFlight']).some((scale) =>
          hasDeparted(modifyDate(scale['a:DepartureTime'], parseInt(scale['a:UTCDepartureOffset']), true).toString())
        ),
        timeToCloseCheckIn: calculateCheckinCloseTime(returnFlight['a:DepartureTime']),
        packageInfo: packages.find(({ name }) => name == String(airlinePerson['a:WebFareType']).split(':')[1]) || {},
        operatingCarrier: returnFlight['a:OperatingCarrier'],
        operatingFlightNumber: returnFlight['a:OperatingFlightNumber'],
        origin: returnFlight['a:Origin'],
        originName: returnFlight['a:OriginName'],
        destination: returnFlight['a:Destination'],
        destinationName: returnFlight['a:DestinationName'],
        showMessage: secondFlightShowMessage || !reservationStatus,
        originAirportName: airports.find(({ code }) => code == returnFlight['a:Origin'])?.name || '',
        destinationAirportName: airports.find(({ code }) => code == returnFlight['a:Destination'])?.name || '',
        destinationAirportImage:
          airportImages.find(({ title }) => title[0]?.text == returnFlight['a:Destination'])?.image?.url || '',
        departureTime: returnFlight['a:DepartureTime'],
        arrivalTime: returnFlight['a:Arrivaltime'],
        amountOfScales: amountOfScalesReturnFlight || 0,
        flights: ScalesReturnFlight,
        fareBasisCode: Array.isArray(returnFlight['a:PhysicalFlights']['a:PhysicalFlight'])
          ? Array.isArray(
              returnFlight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ]
            )
            ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ][0]['a:FareBasisCode']
            : returnFlight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ]['a:FareBasisCode']
          : Array.isArray(
              returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ]
            )
          ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ][0]['a:FareBasisCode']
          : returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ]['a:FareBasisCode'],

        fareClassCode: Array.isArray(returnFlight['a:PhysicalFlights']['a:PhysicalFlight'])
          ? Array.isArray(
              returnFlight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ]
            )
            ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ][0]['a:FareClassCode']
            : returnFlight['a:PhysicalFlights']['a:PhysicalFlight'][0]['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ]['a:FareClassCode']
          : Array.isArray(
              returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ]
            )
          ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ][0]['a:FareClassCode']
          : returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
              'a:AirlinePerson'
            ]['a:FareClassCode'],
      });
  }

  let errorPaymentMessage = null;
  if (parseInt(response['s:Body'].RetrievePNRResponse.RetrievePNRResult['a:ReservationBalance']) != 0)
    errorPaymentMessage = 'La reserva tiene balance no pago';
  else if (
    Array.isArray(response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Payments']['a:Payment'])
      ? response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']?.['a:Payments']?.['a:Payment'].some(
          (transaction) => parseInt(transaction['a:TransactionStatus']) == 0
        )
      : parseInt(
          response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']?.['a:Payments']?.['a:Payment']?.[
            'a:TransactionStatus'
          ]
        ) == 0
  )
    errorPaymentMessage = 'La reserva tiene pagos sin procesar';

  const paymentStatus =
    reservationBalance != 0 ||
    (Array.isArray(response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Payments']['a:Payment'])
      ? response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']?.['a:Payments']?.['a:Payment'].some(
          (transaction) => Number(transaction['a:TransactionStatus']) == 0
        )
      : Number(
          response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']?.['a:Payments']?.['a:Payment']?.[
            'a:TransactionStatus'
          ]
        ) == 0)
      ? false
      : true;
  const parsedResponse = {
    todaysDate,
    reservationStatus,
    reservationMessage: !reservationStatus,
    reservationKey: response['s:Body'].RetrievePNRResponse.RetrievePNRResult['a:Key'],
    paymentStatus,
    currency: response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:ReservationCurrency'],
    currencySymbol:
      CurrencySymbols[response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:ReservationCurrency']],
    errorPaymentMessage,
    passengers: parsedPersonalInformation,
    key: confirmationKey,
    confirmationNumber: confirmationNumber['a:ConfirmationNumber'],
    flights: flights.sort((flightOne, flightTwo) => {
      if (moment(flightOne.departureTime).isBefore(flightTwo.departureTime)) return -1;
      if (moment(flightOne.departureTime).isAfter(flightTwo.departureTime)) return 1;
      return 0;
    }),
  };
  return parsedResponse;
};
