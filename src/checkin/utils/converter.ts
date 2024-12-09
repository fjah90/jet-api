import { getPassengerDescription } from "./passengerType";

interface FlightInfo {
  passengerName: string;
  confirmationNumber: string;
  origin: string;
  destination: string;
  flightOperator: string;
  operatingFlightNumber: string;
  departureDate: string;
  dayOfYear: string;
  classOfPassenger: string;
  seat: string;
  boardingPassNumber: string;
  hasTickets: string;
  age: number;
  ageOfPassengers: number[];
}

export const generateBoardingPassString = ({
  passengerName,
  confirmationNumber,
  origin,
  destination,
  flightOperator,
  operatingFlightNumber,
  dayOfYear,
  classOfPassenger,
  seat,
  boardingPassNumber,
  hasTickets,
  age,
  ageOfPassengers,
}: FlightInfo): string => {
  const confirmationString = confirmationNumber.padEnd(7, ' ');
  const routeString = `${origin}${destination}${flightOperator}`.padEnd(9, ' ');
  const flightString = operatingFlightNumber.padEnd(5, ' ');
  const seatString = `${dayOfYear}${classOfPassenger}${seat}${boardingPassNumber}`.padEnd(9, ' ');

  const passengerDescription = getPassengerDescription(age, ageOfPassengers);
  const hasTicketsString = hasTickets === 'false' ? ' ' : 'E';

  return `M1${passengerName}${hasTicketsString}${confirmationString}${routeString}${flightString}${seatString} 35D>518${passengerDescription}WW    B${flightOperator}              2A             0 ${flightOperator}                        N                     `;
};
