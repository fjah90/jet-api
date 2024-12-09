import { JsonLogger } from 'src/utils/json-logger';
import { Parser } from '../utils/json-xml.parser';
import { Formatter } from '../utils/xml.formatter';
import { CreatePnrRequest } from './dto/create-pnr-request.dto';
import { UpdatePassengerInfoDto } from './dto/summary-pnr-request.dto';
import { ModifyPNRDto } from './dto/modify-pnr.dto';
import { ActionTypeModifyPnr } from './enums/action-type';
import { axiosInstance } from 'src/interceptors/axios.interceptor';
import { SummaryPnrAgencyRequest } from './dto/summary-pnr-agency-request.dto';

export class PnrAgencyRemoteRepository {
  private logger = new JsonLogger(PnrAgencyRemoteRepository.name);
  private async axiosClient(args, url, headers, actionType, user) {
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    const jsonResponse: any = await Parser.convertXMLToJSON(xmlResponse);
    // if (JSON.parse(process.env.SHOW_SWAGGER))
    this.logger.log(`user:${user} [LOG INFO AFTER ${actionType}] ${JSON.stringify(jsonResponse)} `);
    return jsonResponse;
  }
  public async summaryPnr(request: SummaryPnrAgencyRequest, token, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Reservation.svc`;
    const payload = {
      'tem:SummaryPNR': {
        'tem:SummaryPnrRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ActionType': 'GetSummary',
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': request.reservationInfo.seriesNumber,
            'rad:ConfirmationNumber': request.reservationInfo.confirmationNumber,
          },
          'rad1:SecurityToken': token,
          'rad1:CarrierCurrency': request.carrierCurrency,
          'rad1:DisplayCurrency': request.displayCurrency,
          'rad1:IATANum': request.IATA,
          'rad1:User': '',
          'rad1:ReceiptLanguageID': request.receiptLanguageID,
          'rad1:PromoCode': request.promoCode || '',
          'rad1:ExternalBookingID': '',
          'rad1:Address': request.address.toXml(),
          'rad1:ContactInfos': request.contacts.map((contact) => contact.toXml()),
          'rad1:Passengers': request.passengers.map((passenger) => passenger.toXml()),
          'rad1:Segments': request.segments.map((segment) => segment.toXml()),
          'rad1:Payments': '',
          'rad1:Comment': '',
          'rad1:ReferralID': '',
        },
      },
    };
    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Reservation/SummaryPNR',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Reservation');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'SUMMARY PNR', user);
      return jsonResponse;
    } catch (error) {
      throw new Error(JSON.stringify(error?.response?.data));
    }
  }

  public async createPnr(token, actionType, confirmationNumber, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Reservation.svc`;
    const payload = {
      'tem:CreatePNR': {
        'tem:CreatePnrRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ActionType': actionType,
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': 299,
            'rad:ConfirmationNumber': confirmationNumber,
          },
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Reservation/CreatePNR',
      },
    };

    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Reservation');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'CREATE PNR', user);
      return jsonResponse;
    } catch (err) {
      throw new Error(JSON.stringify(err));
    }
  }

  public async createPnrWeb(token, actionType, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Reservation.svc`;
    const payload = {
      'tem:CreatePNR': {
        'tem:CreatePnrRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ActionType': actionType,
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': 299,
            'rad:ConfirmationNumber': '',
          },
        },
      },
    };

    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Reservation/CreatePNR',
      },
    };

    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Reservation');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'CREATE PNR', user);
      return jsonResponse;
    } catch (err) {
      throw new Error(JSON.stringify(err));
    }
  }

  public async modifyPnr(
    request: UpdatePassengerInfoDto | ModifyPNRDto,
    token: string,
    actionType: ActionTypeModifyPnr,
    body,
    user: string
  ) {
    const actionsTypes = {
      [ActionTypeModifyPnr.UPDATE_PASSENGER]: 'UpdatePassengerInformationNoFee',
      [ActionTypeModifyPnr.ADD_SPECIAL_SERVICES]: 'AddSpecialServiceToReservation',
    };
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Reservation.svc`;
    const payload = {
      'tem:ModifyPNR': {
        'tem:ModifyPnrRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ActionType': actionsTypes[actionType],
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': 299,
            'rad:ConfirmationNumber': request.confirmationNumber,
          },
          'rad1:FareInformationID': '-1',
          'rad1:LogicalFlightKeyToReplace': ' ',
          'rad1:LogicalFlightKeyToRemove': ' ',
          'rad1:PersonOrgIdentifierToRemove': 0,
          'rad1:PassengersToAdd': ' ',
          'rad1:PassengersToUpdate': actionType === ActionTypeModifyPnr.UPDATE_PASSENGER ? body : ' ',
          'rad1:SpecialServices': actionType === ActionTypeModifyPnr.ADD_SPECIAL_SERVICES ? body : ' ',
          'rad1:SpecialServicesToCancel': actionType === ActionTypeModifyPnr.CANCEL_SPECIAL_SERVICES ? body : ' ',
          'rad1:ContactInformationToAdd': ' ',
          'rad1:ContactInformationToUpdate': ' ',
          'rad1:CommentToAdd': {
            'rad1:CommentID': '-1',
            'rad1:Comment': 'Kavita-Testing',
          },
          'rad1:IsFlightDisruptionModify': false,
        },
      },
    };
    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Reservation/ModifyPNR',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Reservation');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'MODIFY PNR', user);
      return jsonResponse;
    } catch (error) {
      this.logger.log('Failed update: ' + JSON.stringify(error.message));
      throw new Error(JSON.stringify(error));
    }
  }

  public async saveReservation(request: CreatePnrRequest, token, user: string) {
    const url = `${process.env.RADIXX_URL}/Radixx.Connectpoint/ConnectPoint.Reservation.svc`;
    const payload = {
      'tem:CreatePNR': {
        'tem:CreatePnrRequest': {
          'rad:SecurityGUID': token,
          'rad:CarrierCodes': {
            'rad:CarrierCode': {
              'rad:AccessibleCarrierCode': '?',
            },
          },
          'rad1:ActionType': 'SaveReservation',
          'rad1:ReservationInfo': {
            'rad:SeriesNumber': request.reservationInfo.seriesNumber,
            'rad:ConfirmationNumber': request.reservationInfo.confirmationNumber,
          },
        },
      },
    };
    const headers = {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: 'http://tempuri.org/IConnectPoint_Reservation/CreatePNR',
      },
    };
    try {
      const args = Formatter.convertJSONToSoapRequest(payload, 'Reservation');
      const jsonResponse: any = await this.axiosClient(args, url, headers, 'SAVE RESERVATION', user);
      return jsonResponse;
    } catch (err) {
      throw new Error(JSON.stringify(err));
    }
  }
}
