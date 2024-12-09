import { CreateCheckinWihtTokenDto, PassengerOfCheckinDto } from '../dto';
import * as moment from 'moment/moment';

export const formatPassegner = ({
  passengers,
  reservationKey,
  logicalFlightKey,
  physicalFlightKey,
  customerKey,
}: CreateCheckinWihtTokenDto) =>
  passengers.map((passenger: PassengerOfCheckinDto) => {
    return {
      'rad1:CheckInDetail': {
        'rad1:ReservationKey': reservationKey,
        'rad1:LogicalFlightKey': logicalFlightKey,
        'rad1:PhysicalFlightKey': physicalFlightKey,
        'rad1:CustomerKey': customerKey,
        'rad1:AirLinePersonKey': passenger.airLinePersonKey,
        'rad1:SeatAssignmentKey': passenger.seatAssignmentKey,
      },
    };
  });

export const formatDayOfYear = (dateString: string): number => {
  const date = new Date(dateString);
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  return dayOfYear;
};

export const formatToNumberValid = (num: number): string => {
  if (num < 100) {
    return `0${num.toString().padStart(2, '0')}`;
  }
  return num.toString();
};

export const formatNumber = (num: number): string => {
  return num.toString().padStart(4, '0');
};

const isHomogeneous = (arr: any[]): boolean => {
  return arr.every((item) => typeof item === typeof arr[0]);
};

export const flattenArray = (arr: Array<Array<any>>) => {
  if (!isHomogeneous(arr.flat())) {
    throw new Error('The elements of array is not equals type');
  }

  return arr.reduce((acc, curr) => {
    return acc.concat(curr);
  }, []);
};

export const unifyBoardingPasses = (boardingPasses) => {
  return boardingPasses.flatMap((obj) => obj.boardingPass);
};

export const generateFullName = (firstName: string, lastName: string, middleName: string, title: string): string => {
  const fullName = `${lastName.replace(/\s/g, '')}/${firstName.replace(/\s/g, '')}${
    middleName ? middleName.replace(/\s/g, '') : ''
  }${title.replace(/\s/g, '')}`;
  if (fullName.length > 20) {
    return fullName.slice(0, 20);
  } else if (fullName.length < 20) {
    return fullName.padEnd(20, ' ');
  } else {
    return fullName;
  }
};

export const sumHours = (field: string, hours: string) => {
  return moment(field).add(hours, 'hours').format('YYYY-MM-DDTHH:mm:ss');
};

export const operatedBy = (val: string) => {
  switch (val) {
    case 'E9':
      return 'Evelop';
    case '6O':
      return 'Orbest';
    case 'UX':
      return 'Air europa';
    default:
      return val;
  }
};
