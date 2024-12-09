import * as moment from 'moment';
import { RetrieveReservationsDto } from '../dto/get-reservations.dto';
import { ReservationDto } from 'src/pnr/dto/reservation.dto';
import { modifyDate, validateDate, hasDeparted } from '../utils/dateModify';
import { citiesAvailables } from '../utils/citiesAvailables';
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

export const converterReservationList = (
  response,
  lastName: string,
  disableWebCheckinForSsrs,
  airports,
  { items: airportImages }
) => {
  const passengersIds = [];

  const reservationBalance = parseFloat(
    response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:ReservationBalance']
  );

  let btnBoardingPass = false;
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
  let firstFlightcheckinBlocked = false;
  let secondFlightcheckinBlocked = false;
  const flightInformation =
    response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']['a:Airline']['a:LogicalFlight'][
    'a:LogicalFlight'
    ];

  const flightsCount = Formatter.forceArray(flightInformation).length;
  const hasThreeOrMoreFlights = flightsCount >= 3;
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

  const flightStatus =
    !amountOfScalesFlight &&
    flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'][
    'a:ResSegStatus'
    ];

  const returnFlight = Array.isArray(flightInformation)
    ? flightInformation.length
      ? new Date(flightInformation[1]['a:DepartureTime']) > new Date(flightInformation[0]['a:DepartureTime'])
        ? flightInformation[1]
        : flightInformation[0]
      : undefined
    : undefined;

  const amountOfScalesReturnFlight = returnFlight && returnFlight['a:PhysicalFlights']['a:PhysicalFlight'].length - 1;

  const returnFlightStatus =
    returnFlight &&
    !amountOfScalesReturnFlight &&
    returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
    'a:AirlinePerson'
    ]['a:ResSegStatus'];

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
            timeToCloseCheckIn: calculateCheckinCloseTime(item['a:DepartureTime']),
            arrivaltime: item['a:Arrivaltime'],
            flightDuration: item['a:FlightDuration'],
            destination: item['a:Destination'],
            destinationName: item['a:DestinationName'],
            origin: item['a:Origin'],
            originName: item['a:OriginName'],
            checkinBlocked: secondFlightcheckinBlocked,
            originAirportName: airports.find(({ code }) => code == item['a:Origin'])?.name || '',
            destinationAirportName: airports.find(({ code }) => code == item['a:Destination'])?.name || '',
            destinationAirportImage:
              airportImages.find(({ title }) => title[0]?.text == item['a:Destination'])?.image?.url || '',
            persons: Array.isArray(item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'])
              ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'].map((person) => {
                return {
                  airLinePersonKey: person['a:Key'],
                  checkinStatus: !(parseInt(person['a:ResSegStatus']) === 1),
                  resSegStatus: parseInt(person['a:ResSegStatus']),
                  personOrgID: person['a:PersonOrgID'],
                  person: `${person['a:FirstName']}${person['a:MiddleName'] ?? ` ${person['a:MiddleName']}`} ${person['a:LastName']
                    }`,
                  // openToCheckIn: parseInt(person['a:ResSegStatus']) === 1 ? true : false,
                  passengerTypeID: person['a:PTCID'],
                  services: Array.isArray(person['a:Charges']['a:Charge'])
                    ? person['a:Charges']['a:Charge']
                      .filter((item) => item['a:IsSSR'] === 'true')
                      .map((item) => ({
                        code: item['a:CodeType'],
                        description: item['a:Description'],
                        serviceID: '',
                        categoryID: '',
                      }))
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
                  personOrgID:
                    item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:PersonOrgID'],
                  person: `${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:FirstName']
                    }${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName'] ??
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
                      .filter((item) => item['a:IsSSR'] === 'true')
                      .map((item) => ({
                        code: item['a:CodeType'],
                        description: item['a:Description'],
                        serviceID: '',
                        categoryID: '',
                      }))
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
          timeToCloseCheckIn: calculateCheckinCloseTime(
            returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime']
          ),
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
          checkinBlocked: secondFlightcheckinBlocked,
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
                person: `${person['a:FirstName']}${person['a:MiddleName'] ?? ` ${person['a:MiddleName']}`} ${person['a:LastName']
                  }`,
                resSegStatus: parseInt(person['a:ResSegStatus']),
                passengerTypeID: person['a:PTCID'],
                // openToCheckIn: parseInt(person['a:ResSegStatus']) === 1 ? true : false,
                services: Array.isArray(person['a:Charges']['a:Charge'])
                  ? person['a:Charges']['a:Charge']
                    .filter((item) => item['a:IsSSR'] === 'true')
                    .map((item) => ({
                      code: item['a:CodeType'],
                      description: item['a:Description'],
                      serviceID: '',
                      categoryID: '',
                    }))
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
                person: `${returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                  'a:AirlinePersons'
                ]['a:AirlinePerson']['a:FirstName']
                  }${returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                  'a:AirlinePersons'
                  ]['a:AirlinePerson']['a:MiddleName'] ??
                  ` ${returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName']}`
                  } ${returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
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
                services: Array.isArray(
                  returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                  'a:AirlinePersons'
                  ]['a:AirlinePerson']['a:Charges']['a:Charge']
                )
                  ? returnFlight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer'][
                    'a:AirlinePersons'
                  ]['a:AirlinePerson']['a:Charges']['a:Charge']
                    .filter((item) => item['a:IsSSR'] === 'true')
                    .map((item) => ({
                      code: item['a:CodeType'],
                      description: item['a:Description'],
                      serviceID: '',
                      categoryID: '',
                    }))
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
          flightDuration: item['a:FlightDuration'],
          destination: item['a:Destination'],
          destinationName: item['a:DestinationName'],
          origin: item['a:Origin'],
          originName: item['a:OriginName'],
          checkinBlocked: firstFlightcheckinBlocked,
          originAirportName: airports.find(({ code }) => code == item['a:Origin'])?.name || '',
          persons: Array.isArray(item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'])
            ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson'].map((person) => {
              return {
                airLinePersonKey: person['a:Key'],
                checkinStatus: !(parseInt(person['a:ResSegStatus']) === 1),
                resSegStatus: parseInt(person['a:ResSegStatus']),
                personOrgID: person['a:PersonOrgID'],
                person: `${person['a:FirstName']}${person['a:MiddleName'] ?? ` ${person['a:MiddleName']}`} ${person['a:LastName']
                  }`,
                passengerTypeID: person['a:PTCID'],
                // openToCheckIn: parseInt(person['a:ResSegStatus']) === 1 ? true : false,
                services: Array.isArray(person['a:Charges']['a:Charge'])
                  ? person['a:Charges']['a:Charge']
                    .filter((charge) => charge['a:IsSSR'] === 'true')
                    .map((item) => ({
                      code: item['a:CodeType'],
                      description: item['a:Description'],
                      serviceID: '',
                      categoryID: '',
                    }))
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
                person: `${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:FirstName']
                  }${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName'] ??
                  ` ${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName']}`
                  } ${item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:LastName']}`,
                resSegStatus: parseInt(
                  item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:ResSegStatus']
                ),
                passengerTypeID:
                  item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:PTCID'],
                services: Array.isArray(
                  item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:Charges']['a:Charge']
                )
                  ? item['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:Charges'][
                    'a:Charge'
                  ]
                    .filter((item) => item['a:IsSSR'] === 'true')
                    .map((item) => ({
                      code: item['a:CodeType'],
                      description: item['a:Description'],
                      serviceID: '',
                      categoryID: '',
                    }))
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
          destinationAirportName: airports.find(({ code }) => code == item['a:Destination'])?.name || '',
          destinationAirportImage:
            airportImages.find(({ title }) => title[0]?.text == item['a:Destination'])?.image?.url || '',
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
        arrivaltime: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Arrivaltime'],
        flightDuration: flight['a:PhysicalFlights']['a:PhysicalFlight']['a:FlightDuration'],
        hasDeparted: hasDeparted(
          modifyDate(
            flight['a:PhysicalFlights']['a:PhysicalFlight']['a:DepartureTime'],
            parseInt(flight['a:PhysicalFlights']['a:PhysicalFlight']['a:UTCDepartureOffset']),
            true
          ).toString()
        ),
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
        checkinBlocked: firstFlightcheckinBlocked,
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
              resSegStatus: parseInt(person['a:ResSegStatus']),
              person: `${person['a:FirstName']}${person['a:MiddleName'] ?? ` ${person['a:MiddleName']}`} ${person['a:LastName']
                }`,
              passengerTypeID: person['a:PTCID'],
              // openToCheckIn: parseInt(person['a:ResSegStatus']) === 1 ? true : false,
              services: Array.isArray(person['a:Charges']['a:Charge'])
                ? person['a:Charges']['a:Charge']
                  .filter((item) => item['a:IsSSR'] === 'true')
                  .map((item) => ({
                    code: item['a:CodeType'],
                    description: item['a:Description'],
                    serviceID: '',
                    categoryID: '',
                  }))
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
                ) == 1
              ),
              personOrgID:
                flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
                ]['a:PersonOrgID'],
              person: `${flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
              ]['a:FirstName']
                }${flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
                ]['a:MiddleName'] ??
                ` ${flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons']['a:AirlinePerson']['a:MiddleName']}`
                } ${flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
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
              services: Array.isArray(
                flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                'a:AirlinePerson'
                ]['a:Charges']['a:Charge']
              )
                ? flight['a:PhysicalFlights']['a:PhysicalFlight']['a:Customers']['a:Customer']['a:AirlinePersons'][
                  'a:AirlinePerson'
                ]['a:Charges']['a:Charge']
                  .filter((item) => item['a:IsSSR'] === 'true')
                  .map((item) => ({
                    code: item['a:CodeType'],
                    description: item['a:Description'],
                    serviceID: '',
                    categoryID: '',
                  }))
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

  let parsedPersonalInformation;
  if (Array.isArray(passengersList)) {
    parsedPersonalInformation = passengersList.map((passenger) => {
      passengersIds.push(passenger['a:Key']);
      return {
        key: passenger['a:Key'],
        firstName: passenger['a:FirstName'],
        lastName: passenger['a:LastName'],
        resSegStatus: parseInt(passenger['a:ResSegStatus']),
        middleName: passenger['a:MiddleName'],
        age: passenger['a:Age'],
        dob: passenger['a:DOB'],
        gender: passenger['a:Gender'],
        title: passenger['a:Title'],
        languageId: passenger['a:NationalityLaguageID'],
        address: passenger['a:Address'],
        address2: passenger['a:Address2'],
        city: passenger['a:City'],
        state: passenger['a:State'],
        postalCode: passenger['a:Postal'],
        country: passenger['a:Country'],
      };
    });
  } else {
    passengersIds.push(passengersList['a:Key']);
    parsedPersonalInformation = [
      {
        firstName: passengersList['a:FirstName'],
        lastName: passengersList['a:LastName'],
        resSegStatus: parseInt(passengersList['a:ResSegStatus']),
        middleName: passengersList['a:MiddleName'],
        age: passengersList['a:Age'],
        dob: passengersList['a:DOB'],
        gender: passengersList['a:Gender'],
        title: passengersList['a:Title'],
        languageId: passengersList['a:NationalityLaguageID'],
        address: passengersList['a:Address'],
        address2: passengersList['a:Address2'],
        city: passengersList['a:City'],
        state: passengersList['a:State'],
        postalCode: passengersList['a:Postal'],
        country: passengersList['a:Country'],
      },
    ];
  }
  if (!parsedPersonalInformation.some((passenger) => passenger.lastName.replace(/\s/g, '') === lastName)) return null;

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

  let firstFlightStatus = false;

  for (const scale of ScalesFlight) {
    if (
      scale.persons.some((person) => {
        if (person.checkinStatus && person.resSegStatus) btnBoardingPass = true;

        if (!person.checkinStatus) {
          return true;
        }
        return false;
      })
    ) {
      firstFlightStatus = true;
    }

    if (!scale.persons.every((person) => !person.resSegStatus)) {
      if (scale.persons.every((person) => person.resSegStatus && !hasThreeOrMoreFlights)) {
        firstFlightOfReservationStatus = 1;
        reservationStatus = 1;
      } else if (scale.persons.some((person) => person.resSegStatus) && !hasThreeOrMoreFlights) {
        firstFlightOfReservationStatus = 1;
        reservationStatus = 1;
        parsedPersonalInformation = parsedPersonalInformation.filter((person) => person.resSegStatus);
        scale.persons = scale.persons.filter((person) => person.resSegStatus);
      }
    } else if (flightsCount == 1) firstFlightOfReservationStatus = 1;
    delete scale.persons;
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
      operatingCarrier: flight['a:OperatingCarrier'],
      operatingFlightNumber: flight['a:OperatingFlightNumber'],
      origin: flight['a:Origin'],
      originName: flight['a:OriginName'],
      destination: flight['a:Destination'],
      hasDeparted: Formatter.forceArray(flight['a:PhysicalFlights']['a:PhysicalFlight']).some((scale) =>
        hasDeparted(modifyDate(scale['a:DepartureTime'], parseInt(scale['a:UTCDepartureOffset']), true).toString())
      ),
      destinationName: flight['a:DestinationName'],
      originAirportName: airports.find(({ code }) => code == flight['a:Origin'])?.name || '',
      destinationAirportName: airports.find(({ code }) => code == flight['a:Destination'])?.name || '',
      destinationAirportImage:
        airportImages.find(({ title }) => title[0]?.text == flight['a:Destination'])?.image?.url || '',
      departureTime: flight['a:DepartureTime'],
      arrivalTime: flight['a:Arrivaltime'],
      amountOfScales: amountOfScalesFlight || 0,
      flights: ScalesFlight,
    });

  if (returnFlight) {
    let secondFlightStatus = false;

    for (const scale of ScalesReturnFlight) {
      if (
        scale.persons.some((person) => {
          if (person.checkinStatus && person.resSegStatus) btnBoardingPass = true;
          if (!person.checkinStatus) {
            return true;
          }
          return false;
        })
      ) {
        secondFlightStatus = true;
      }

      if (!scale.persons.every((person) => !person.resSegStatus))
        if (scale.persons.every((person) => person.resSegStatus && !hasThreeOrMoreFlights)) {
          secondFlightOfReservationStatus = 1;
          reservationStatus = 1;
        } else if (scale.persons.some((person) => person.resSegStatus) && !hasThreeOrMoreFlights) {
          secondFlightOfReservationStatus = 1;
          reservationStatus = 1;
          parsedPersonalInformation = parsedPersonalInformation.filter((person) => person.resSegStatus);
          scale.persons = scale.persons.filter((person) => person.resSegStatus);
        }
      delete scale.persons;
    }

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
        operatingCarrier: returnFlight['a:OperatingCarrier'],
        operatingFlightNumber: returnFlight['a:OperatingFlightNumber'],
        origin: returnFlight['a:Origin'],
        hasDeparted: Formatter.forceArray(flight['a:PhysicalFlights']['a:PhysicalFlight']).some((scale) =>
          hasDeparted(modifyDate(scale['a:DepartureTime'], parseInt(scale['a:UTCDepartureOffset']), true).toString())
        ),
        originName: returnFlight['a:OriginName'],
        destination: returnFlight['a:Destination'],
        destinationName: returnFlight['a:DestinationName'],
        originAirportName: airports.find(({ code }) => code == returnFlight['a:Origin'])?.name || '',
        destinationAirportName: airports.find(({ code }) => code == returnFlight['a:Destination'])?.name || '',
        destinationAirportImage:
          airportImages.find(({ title }) => title[0]?.text == returnFlight['a:Destination'])?.image?.url || '',
        departureTime: returnFlight['a:DepartureTime'],
        arrivalTime: returnFlight['a:Arrivaltime'],
        amountOfScales: amountOfScalesReturnFlight || 0,
        flights: ScalesReturnFlight,
      });
  }

  let errorPaymentMessage = null;
  if (parseInt(response['s:Body'].RetrievePNRResponse.RetrievePNRResult['a:ReservationBalance']) != 0)
    errorPaymentMessage = 'La reserva tiene balance no pago';
  else if (
    Array.isArray(response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']?.['a:Payments']?.['a:Payment'])
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

  const btnCheckIn = !reservationStatus
    ? 0
    : flights.some(({ availableToCheckIn }) => availableToCheckIn)
      ? 1
      : flights.some(({ checkinBlocked }) => checkinBlocked) ||
        flights.every(({ hasDeparted }) => hasDeparted) ||
        !paymentStatus
        ? 0
        : 2;

  const boardingPassCondition = !reservationStatus ? false : btnBoardingPass;
  const checkinCondition = btnCheckIn === 1 && process.env.BTN_CHECKIN_TEMPORAL && JSON.parse(process.env.BTN_CHECKIN_TEMPORAL)
    ? 3
    : btnCheckIn;
  const parsedResponse = {
    reservationStatus,
    reservationMessage: !reservationStatus,
    paymentStatus,
    confirmationNumber: confirmationNumber['a:ConfirmationNumber'],
    btnBoardingPass: JSON.parse(process.env.BTN_BOARDING_PASS_ENABLED) ? boardingPassCondition : false,
    hasDeparted: flights.every((flight) => flight.hasDeparted),
    passengersIds,
    errorPaymentMessage,
    btnCheckIn: JSON.parse(process.env.BTN_CHECKIN_ENABLED) ? checkinCondition : 0
    ,
    flights: flights.sort((flightOne, flightTwo) => {
      if (moment(flightOne.departureTime).isBefore(flightTwo.departureTime)) return -1;
      if (moment(flightOne.departureTime).isAfter(flightTwo.departureTime)) return 1;
      return 0;
    }),
  };
  return parsedResponse;
};
