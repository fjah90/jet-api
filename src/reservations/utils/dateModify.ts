import * as moment from 'moment';

export const modifyDate = (date: string, hoursQuantity: number, isDepertureTime: boolean): Date => {
  const dateFormatted = moment(date).utc(true);
  const dateModified = !isDepertureTime
    ? moment(dateFormatted).add(hoursQuantity, 'hours').utc(true)
    : moment(dateFormatted).subtract(hoursQuantity, 'hours').utc(true);
  return dateModified.toDate();
};

export const validateDate = (date, ActualDate) => {
  const start = moment.utc(date).subtract(24, 'hours');
  const end = moment.utc(date).subtract(4, 'hours');
  return moment.utc(ActualDate).isBetween(start, end);
};

export const isWithinFourHours = (date, ActualDate) => {
  const start = moment.utc(date).subtract(4, 'hours');
  const departureTime = moment.utc(date);
  return moment.utc(ActualDate).isBetween(start, departureTime);
};

export const hasDeparted = (departureTime: string): boolean => {
  const departureDate = moment(departureTime);
  const currentDate = moment();
  return departureDate.isBefore(currentDate);
};

export const getDifferenceInUtcDates = (date1: string, date2: string) => {
  const momentDate1 = moment.utc(date1);
  const momentDate2 = moment.utc(date2);
  const diffInMilliseconds = momentDate2.diff(momentDate1);
  const millisecondsInDay = 24 * 60 * 60 * 1000; // 24 horas * 60 minutos * 60 segundos * 1000 milisegundos
  const diffInDays = diffInMilliseconds / millisecondsInDay;
  return Math.abs(diffInDays); // Devolvemos la diferencia en valor absoluto
};

export const calculateRemainingMinutes = (departureTime: string, todaysDate: string): boolean => {
  const departureDateTime = moment(departureTime).utc();
  const currentDate = moment(todaysDate).utc();

  const differenceInMinutes = departureDateTime.diff(currentDate, 'minutes');

  return differenceInMinutes >= parseInt(process.env.MINUTES_REMAINING_BEFORE_THE_FLIGHT);
};
