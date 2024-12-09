import { EditSeatDto, SeatElementDto } from '../dto';

export const formatSeats = ({ seats, reservationKey }: EditSeatDto, customerKey) =>
  seats.map(
    ({
      airLinePersonKey,
      seatAssignmentKey,
      seat,
      rowNumber,
      oldSeat,
      oldRowNumber,
      isExtraSeat,
      logicalFlightKey,
      physicalFlightKey,
    }: SeatElementDto) => {
      return {
        'rad1:SeatAssignmentDetail': {
          'rad1:ReservationKey': reservationKey,
          'rad1:LogicalFlightKey': logicalFlightKey,
          'rad1:PhysicalFlightKey': physicalFlightKey,
          'rad1:CustomerKey': customerKey,
          'rad1:AirLinePersonKey': airLinePersonKey,
          'rad1:SeatAssignmentKey': seatAssignmentKey,
          'rad1:Seat': seat,
          'rad1:RowNumber': rowNumber,
          'rad1:OldSeat': oldSeat || '',
          'rad1:OldRowNumber': oldRowNumber || '',
          'rad1:IsExtraSeat': isExtraSeat,
        },
      };
    }
  );
