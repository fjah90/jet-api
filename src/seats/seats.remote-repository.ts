import { Parser } from 'src/utils/json-xml.parser';
import { Formatter } from 'src/utils/xml.formatter';
import { EditSeatDto } from './dto';
import { SeatsInputDto } from './dto/seats-input.dto';
import { formatSeats } from './utils/formatter';
import { JsonLogger } from 'src/utils/json-logger';
import { axiosInstance } from 'src/interceptors/axios.interceptor';

export class SeatsRemoteRepository {
  private logger = new JsonLogger(SeatsRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType, user) {
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO AFTER ${actionType}] ${JSON.stringify(jsonResponse)} `);
    return jsonResponse;
  }
  public async getSeatsRemote(seatsInputDto: SeatsInputDto, token, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Flight.svc`;
    const payload = {
      'tem:RetrieveFlightSeatMap': {
        'tem:RetrieveFlightSeatMapRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad:ClientIPAddress': '',
          'rad:HistoricUserName': '',
          'rad1:CabinName': '',
          'rad1:Currency': seatsInputDto.currencyCode,
          'rad1:DepartureDate': seatsInputDto.departureDate,
          'rad1:FareBasisCode': '',
          'rad1:LogicalFlightID': seatsInputDto.logicalFlightID,
          'rad1:UTCOffset': '0',
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Flight/RetrieveFlightSeatMap',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(
        payload,
        'http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Flight.Request'
      );
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'GET SEAT MAP', user);
      return jsonResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async getSeatList(seatsInputDto: SeatsInputDto, token, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.ConnectPoint/ConnectPoint.Flight.svc`;
    const payload = {
      'tem:RetrieveSeatAvailabilityList': {
        'tem:RetrieveSeatAvailabilityListRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad:ClientIPAddress': '',
          'rad:HistoricUserName': '',
          'rad1:LogicalFlightID': seatsInputDto.logicalFlightID,
          'rad1:DepartureDate': seatsInputDto.departureDate,
          'rad1:CabinName': '',
          'rad1:Currency': seatsInputDto.currencyCode,
          'rad1:UTCOffset': '0',
          'rad1:FareBasisCode': '',
          'rad1:ExcludePricing': 'false',
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Flight/RetrieveSeatAvailabilityList',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequestCustomSchemas(
        payload,
        'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request" xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Flight.Request"'
      );
      this.logger.log(`user:${user} [LOG INFO BEFORE SEAT LIST] ` + args);
      const xmlResponse = await axiosInstance.post(url, args, headers);
      const clearedXml = Parser.removeSingleTagsFromXml(xmlResponse);
      const jsonResponse: any = await Parser.convertXMLToJSON(clearedXml);
      // if (JSON.parse(process.env.SHOW_SWAGGER))
      this.logger.log(`user:${user} [LOG INFO AFTER SEAT LIST ${JSON.stringify(jsonResponse)}] `);
      return jsonResponse;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  public async editSeats(
    editSeatDto: EditSeatDto,
    { token, customerKey }: { token: string; customerKey: string },
    actionType: string,
    user: string
  ) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Seating.svc`;
    const payload = {
      'tem:SeatAssignment': {
        'tem:SeatAssignmentRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ActionType': actionType,
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': 299,
            'rad:ConfirmationNumber': editSeatDto.confirmationNumber,
          },
          'rad1:SeatAssignmentDetails': formatSeats(editSeatDto, customerKey),
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Seating/SeatAssignment',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Seating');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'SEAT ASSIGNMENT', user);
      return jsonResponse;
    } catch (error) {
      console.log(error);
    }
  }
}
