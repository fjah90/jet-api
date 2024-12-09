import { PassengerReservationDto } from '../dto';

interface Service {
  code: string;
  quantity: number;
}

export const addServicesByType = (services: any[]): Service[] => {
  const aggregatedServices: Service[] = [];

  services.forEach((service) => {
    const index = aggregatedServices.findIndex((aggregatedService) => aggregatedService.code === service.code);
    if (index === -1) {
      aggregatedServices.push({
        code: service.code,
        quantity: 1,
      });
    } else {
      aggregatedServices[index].quantity++;
    }
  });

  return aggregatedServices;
};

export const formatPassegner = (passengers: PassengerReservationDto[]) =>
  passengers.map(({ passengerTypeID }: PassengerReservationDto) => {
    return {
      'rad1:AARRequestPtc': {
        'rad1:PassengerTypeID': passengerTypeID,
        'rad1:Quantity': '1',
      },
    };
  });
