import { ApiProperty } from '@nestjsx/crud/lib/crud';
import { Type } from 'class-transformer';
import { IsAlphanumeric, IsArray, IsBoolean, IsNumber, IsString, Max, MaxLength } from 'class-validator';

class FlightDTO {
  @ApiProperty()
  @IsString()
  physicalFlightID: string;

  @ApiProperty()
  @IsString()
  departureDate: string;

  @ApiProperty()
  @IsString()
  origin: string;

  @ApiProperty()
  @IsString()
  destination: string;

  @ApiProperty()
  @IsString()
  originName: string;

  @ApiProperty()
  @IsString()
  destinationName: string;

  @ApiProperty()
  @IsString()
  tailNum: string;

  @ApiProperty()
  @IsString()
  flightNum: string;

  @ApiProperty()
  @IsString()
  isCircularFlight: string;

  @ApiProperty()
  @IsString()
  legOrder: string;

  @ApiProperty()
  @IsString()
  displayLegOnSeatmap: string;

  @ApiProperty({ type: () => [SeatCodeDTO] })
  seatCodes: SeatCodeDTO[];

  @ApiProperty({ type: () => [CabinDTO] })
  cabins: CabinDTO[];
}

class SeatCodeDTO {
  @ApiProperty()
  @IsString()
  serviceCode: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  quantityAvailable: string;
}

class ColumnDTO {
  @ApiProperty()
  @IsString()
  cabinName: string;

  @ApiProperty()
  @IsString()
  seats: string;
}

class CabinDTO {
  @ApiProperty()
  @IsString()
  cabinName: string;

  @ApiProperty({ type: () => [ColumnDTO] })
  columns: ColumnDTO;

  @ApiProperty({ type: () => [SeatDTO] })
  seats: SeatDTO[];
}

class SeatDTO {
  @ApiProperty()
  @IsString()
  rowNumber: string;

  @ApiProperty()
  @IsString()
  seat: string;

  @ApiProperty()
  @IsString()
  serviceCode: string;

  @ApiProperty()
  @IsString()
  amount: string;

  @ApiProperty({ example: ['123', '456'] })
  @IsString()
  blockedPersonOrgIds: string[];

  @ApiProperty({ example: ['123', '456'] })
  @IsString()
  warningPersonOrgIds: string[];

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsString()
  serviceID: string;

  @ApiProperty()
  @IsString()
  categoryID: string;

  @ApiProperty()
  @IsBoolean()
  isExit: boolean;

  @ApiProperty()
  @IsBoolean()
  isBlocked: boolean;

  @ApiProperty()
  @IsBoolean()
  isReal: boolean;

  @ApiProperty()
  @IsBoolean()
  reserved: boolean;
}

class MessageElement {
  @ApiProperty()
  @IsString()
  @IsAlphanumeric()
  @MaxLength(300)
  title: string;

  @ApiProperty()
  @IsArray()
  items: string[];
}

export class GetSeatListResponse {
  @ApiProperty()
  @Type(() => MessageElement)
  messageWarning: MessageElement;

  @ApiProperty()
  @Type(() => MessageElement)
  messageBlocked: MessageElement;

  @ApiProperty({ type: () => [FlightDTO] })
  flights: FlightDTO[];
}
