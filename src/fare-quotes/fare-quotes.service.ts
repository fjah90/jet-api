/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import * as moment from 'moment';
import { AuthService } from 'src/auth/auth.service';
import { GetTouristInfoDto } from 'src/prismic/dto';
import { Formatter } from 'src/utils/xml.formatter';
import { FareQuoteDetailsDto } from './dto/fare-quote-details.dto';
import { FareQuoteDto } from './dto/fare-quote.dto';
import { FareQuotesRemoteRepository } from './fare-quotes.remote-repository';
import { AirlinesValid } from './entities/airlines-valid.enum';
import { JsonLogger } from 'src/utils/json-logger';
import { StatusCode } from 'src/enums/status-codes.enum';
import { StatsdService } from 'src/statsd/statsd.service';

interface Flight {
  LFID: string;
  departureDate: Date;
  lowestFarePriceWithTax: number;
  cheapest: boolean;
}

@Injectable()
export class FareQuotesService {
  constructor(
    private fareQuotesRemoteRepository: FareQuotesRemoteRepository,
    private authService: AuthService,
    private jsonLogger: JsonLogger,
    private statsdService: StatsdService
  ) {}

  private findCheapestFlights(flights: Flight[]): Flight[] {
    // ordena los vuelos por el precio más bajo en orden ascendente
    flights.sort((a, b) => a.lowestFarePriceWithTax - b.lowestFarePriceWithTax);

    // encuentra el precio más bajo de todos los vuelos
    const cheapestPrice = flights[0]?.lowestFarePriceWithTax;

    // añade el campo cheapest a los vuelos
    return flights.map((flight) => ({
      ...flight,
      cheapest: flight.lowestFarePriceWithTax === cheapestPrice,
    }));
  }

  private getOneFlightPerDay(
    flights: Array<{
      LFID: number;
      departureDate: string;
      lowestFarePriceWithTax: number;
    }>
  ) {
    const arrayOfFlightsPerDay = {};
    flights.forEach((flight) => {
      const date = flight.departureDate.split('T')[0];
      arrayOfFlightsPerDay[date] ? arrayOfFlightsPerDay[date].push(flight) : (arrayOfFlightsPerDay[date] = [flight]);
    });

    const singleFlightPerDay = [];

    for (const date in arrayOfFlightsPerDay) {
      arrayOfFlightsPerDay[date].sort((flightA, flightB) => {
        if (flightA.lowestFarePriceWithTax > flightB.lowestFarePriceWithTax) return 1;
        if (flightA.lowestFarePriceWithTax < flightB.lowestFarePriceWithTax) return -1;
        return 0;
      });
      singleFlightPerDay.push(arrayOfFlightsPerDay[date][0]);
    }

    return singleFlightPerDay;
  }

  public async getFareQuoteRemote(fareQuoteDto: any, firebaseToken: string, user: string): Promise<any> {
    console.log(1);
    if (fareQuoteDto.fares[0]?.show && !fareQuoteDto.date) {
      this.statsdService.timing('_new_search', 4000);
      await this.authService.regenerateToken(firebaseToken);
    }

    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    if (fareQuoteDto.hasOwnProperty('date')) {
      fareQuoteDto = plainToInstance(FareQuoteDetailsDto, fareQuoteDto) as FareQuoteDetailsDto;
    } else {
      fareQuoteDto = plainToInstance(FareQuoteDto, fareQuoteDto) as FareQuoteDto;
    }

    if (fareQuoteDto.hasOwnProperty('date')) {
      fareQuoteDto = plainToInstance(FareQuoteDetailsDto, fareQuoteDto) as FareQuoteDetailsDto;
      fareQuoteDto.fares.forEach((fare, index, fares) => {
        this.applyDateRangeUseCase(fare.departureDate, index, fares, true, fare.arrivalDate);
      });
    } else
      fareQuoteDto.fares.forEach((fare, index, fares) => {
        this.applyDateRangeUseCase(fare.departureDate, index, fares, false, fare.arrivalDate);
      });

    let jsonRadixxResponse: any;
    if (fareQuoteDto.fares[0].isDateRange()) {
      const radixxResponse = await this.fareQuotesRemoteRepository.getFareQuoteDateRangeRemote(
        fareQuoteDto,
        token,
        user
      );
      jsonRadixxResponse = this.processJsonResponse(
        radixxResponse,
        'RetrieveFareQuoteDateRangeResponse',
        'RetrieveFareQuoteDateRangeResult'
      );
      const exception = await this.jsonLogger.processException(
        radixxResponse,
        'RetrieveFareQuoteDateRangeResponse',
        'RetrieveFareQuoteDateRangeResult'
      );
      if (exception.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(exception);
      }
    } else {
      const radixxResponse = await this.fareQuotesRemoteRepository.getFareQuoteRemote(fareQuoteDto, token, user);

      const exception = await this.jsonLogger.processException(
        radixxResponse,
        'RetrieveFareQuoteResponse',
        'RetrieveFareQuoteResult'
      );
      if (exception.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(exception);
      }

      jsonRadixxResponse = this.processJsonResponse(
        radixxResponse,
        'RetrieveFareQuoteResponse',
        'RetrieveFareQuoteResult'
      );
    }
    if (jsonRadixxResponse.flightSegments == null) {
      return {
        flights: [],
      };
    }

    if (fareQuoteDto instanceof FareQuoteDetailsDto) {
      const flights = this.getFlightsForDate((fareQuoteDto as FareQuoteDetailsDto).date, jsonRadixxResponse);
      const flightsWithLegs = flights
        .map((flight) => {
          const flightById = this.findFlightByLFID(flight.LFID, jsonRadixxResponse, fareQuoteDto.fares);
          if (!flightById) return null;
          const legs = flightById.legs.filter(({ operatingCarrier }) =>
            AirlinesValid.some((airlineValid: string) => airlineValid == operatingCarrier)
          );
          return { ...flightById, legs };
        })
        .filter(Boolean);
      return {
        flights: flightsWithLegs,
      };
    } else {
      const flights = this.getFlightsWithLowestFarePrice(jsonRadixxResponse, fareQuoteDto.fares);
      const flightWithCheapestFlights = this.findCheapestFlights(this.getOneFlightPerDay(flights));
      const flightWithCheapestFlightsFormatted = flightWithCheapestFlights.every(({ cheapest }) => cheapest)
        ? flightWithCheapestFlights.map((flight: Flight) => ({ ...flight, cheapest: false }))
        : flightWithCheapestFlights;
      return flightWithCheapestFlightsFormatted.length ? flightWithCheapestFlightsFormatted : { flights: [] };
    }
  }

  public async getServiceQuoteRemote(getTouristInfoDto: GetTouristInfoDto, firebaseToken: string, user: string) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const radixxResponse = await this.fareQuotesRemoteRepository.getServiceQuote(getTouristInfoDto, token, user);
    return this.processJsonResponse(radixxResponse, 'RetrieveServiceQuoteResponse', 'RetrieveServiceQuoteResult');
  }

  public async getServiceBundleDetails(serviceBundleCode: string, firebaseToken: string, user: string) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const radixxResponse = await this.fareQuotesRemoteRepository.getServiceBundleDetails(
      serviceBundleCode,
      token,
      user
    );
    return this.processJsonResponse(
      radixxResponse,
      'RetrieveServiceBundleDetailsResponse',
      'RetrieveServiceBundleDetailsResult'
    );
  }

  public async getFareBundleDetails(bundleCode: string, firebaseToken: string, user: string) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const radixxResponse = await this.fareQuotesRemoteRepository.getFareBundleDetails(bundleCode, token, user);
    return this.processJsonResponse(
      radixxResponse,
      'RetrieveFareBundleDetailsResponse',
      'RetrieveFareBundleDetailsResult'
    );
  }

  private applyDateRangeUseCase(departureDate, index, fares, isFarequoteDetail, arrivalDate) {
    // if (isFarequoteDetail) {
    //   fares[index].departureDate = departureDate;
    //   fares[index].arrivalDate = departureDate;
    // } else {
    const departureDateMoment = moment(departureDate);
    const arrivalDateMoment = moment(arrivalDate);
    if (!index) {
      fares[index].departureDate = departureDateMoment.startOf('month').format('YYYY-MM-DD');
      fares[index].arrivalDate = departureDateMoment.endOf('month').format('YYYY-MM-DD');
    } else {
      fares[index].departureDate = arrivalDateMoment.startOf('month').format('YYYY-MM-DD');
      fares[index].arrivalDate = arrivalDateMoment.endOf('month').format('YYYY-MM-DD');
    }
  }

  private processJsonResponse(fareQuoteRemote: any, response, result) {
    const responseData = fareQuoteRemote['s:Body'][response][result];
    const stringToSearch = 'a:';
    const replacer = new RegExp(stringToSearch, 'g');
    const json = JSON.parse(JSON.stringify(responseData).replace(replacer, ''));
    delete json.$;
    delete json.Exceptions;
    return Formatter.JSONPropertiesToLowerCamel(json);
  }

  private getFlightsWithLowestFarePrice(jsonData, fares) {
    jsonData.flightSegments.flightSegment = this.forceArray(jsonData.flightSegments.flightSegment);
    const visibleFare = fares.find(({ show }) => show);
    const flightSegments = jsonData.flightSegments.flightSegment;
    const segmentDetails = jsonData.segmentDetails.segmentDetail;
    const flights = flightSegments
      .map((flightSegment) => {
        let fareTypes = flightSegment.fareTypes.fareType;
        const segmentDetail = Array.isArray(segmentDetails)
          ? segmentDetails.find(
              ({ LFID, operatingCarrier }) =>
                LFID === flightSegment?.LFID &&
                AirlinesValid.some((airlineValid: string) => airlineValid == operatingCarrier)
            )
          : segmentDetails.LFID === flightSegment?.LFID
          ? segmentDetails
          : null;

        if (
          segmentDetail?.origin != visibleFare.originCode &&
          segmentDetail?.destination != visibleFare.destinationCode
        )
          return null;
        fareTypes = this.forceArray(fareTypes);

        const lowestFarePriceWithTax = this.getLowestFareWithTax(fareTypes);

        return {
          LFID: flightSegment.LFID,
          departureDate: flightSegment.departureDate,
          lowestFarePriceWithTax,
        };
      })
      .filter(Boolean);
    return flights;
  }

  private getLowestFareWithTax(fareTypes) {
    const fares = fareTypes.map((fareType) => {
      let fareInfos = fareType.fareInfos.fareInfo;
      if (!Array.isArray(fareInfos)) {
        fareInfos = [fareInfos];
      }
      const fares = fareInfos.map((fareInfo) => {
        fareInfo.fareAmtInclTax;
        if (Number(fareInfo.seatsAvailable) <= 0) return null;
        if (Number(fareInfo.PTCID) !== 1) return null;

        return fareInfo.fareAmtInclTax;
      });
      return fares.filter(Boolean);
    });
    const lowestFareWithTax = Math.min(...fares.flat());
    return lowestFareWithTax;
  }

  private getFlightsForDate(date, jsonData) {
    jsonData.flightSegments.flightSegment = this.forceArray(jsonData.flightSegments.flightSegment);

    const flightSegments = jsonData.flightSegments.flightSegment;
    const flights = flightSegments.filter(
      (flightSegment) => moment(flightSegment.departureDate).format('YYYY-MM-DD') == date
    );
    return flights;
  }

  private findFlightByLFID(LFID, jsonData, fares) {
    const flightSegments = this.forceArray(jsonData.flightSegments.flightSegment);
    const segmentDetails = jsonData.segmentDetails.segmentDetail;
    const visibleFare = fares.find(({ show }) => show);
    const flightSegmentsFiltered = flightSegments.filter((flightSegment) => {
      const segmentDetail = Array.isArray(segmentDetails)
        ? segmentDetails.find(({ LFID }) => LFID === flightSegment?.LFID)
        : segmentDetails.LFID === flightSegment?.LFID
        ? segmentDetails
        : null;

      if (segmentDetail?.origin != visibleFare.originCode && segmentDetail?.destination != visibleFare.destinationCode)
        return null;

      return flightSegment;
    });
    const flight = flightSegmentsFiltered.find((flightSegment) => flightSegment.LFID == LFID);

    if (!flight) return null;

    flight.flightLegDetails.flightLegDetail = this.forceArray(flight.flightLegDetails.flightLegDetail);

    jsonData.legDetails.legDetail = this.forceArray(jsonData.legDetails.legDetail);

    const legs = this.expandLegsData(flight.flightLegDetails.flightLegDetail, jsonData.legDetails.legDetail);

    flight.fareTypes.fareType = this.forceArray(flight.fareTypes.fareType);

    const fareTypes = this.foreachFareTypeGetLowestFareInfoPrice(flight.fareTypes.fareType);
    return {
      LFID,
      fareTypes,
      legs,
    };
  }

  private expandLegsData(flightLegDetails, legDetails) {
    const legs = flightLegDetails.map((flightLegDetail) => {
      const leg = legDetails.find((legDetail) => legDetail.PFID == flightLegDetail.PFID);
      return leg;
    });
    return legs;
  }

  private foreachFareTypeGetLowestFareInfoPrice(fareTypes) {
    const fares = fareTypes.map((fareType) => {
      let fareInfos = fareType.fareInfos.fareInfo;
      const fareTypeID = fareType.fareTypeID;
      if (!Array.isArray(fareInfos)) {
        fareInfos = [fareInfos];
      }

      const fares = fareInfos.filter((fareInfo) => Number(fareInfo.PTCID) === 1);

      const lowestFarePriceWithTax = fares.sort((el1, el2) => {
        if (Number(el1.fareAmtInclTax) < Number(el2.fareAmtInclTax)) return 1;
        if (Number(el1.fareAmtInclTax) > Number(el2.fareAmtInclTax)) return -1;
        return 0;
      })[fares.length - 1];
      const fareTypeName = fareType.fareTypeName;
      return {
        fareTypeID,
        fareTypeName,
        lowestFarePriceWithTax: Number(lowestFarePriceWithTax['fareAmtInclTax']),
        fareID: lowestFarePriceWithTax['fareID'],
        FBCode: lowestFarePriceWithTax['FBCode'],
        FCCode: lowestFarePriceWithTax['FCCode'],
        bundleCode: lowestFarePriceWithTax['bundleCode'],
      };
    });
    return fares;
  }

  private getLowestFareInfo(fareInfos) {
    fareInfos = this.forceArray(fareInfos);
    const fares = fareInfos.map((fareInfo) => fareInfo.fareAmtInclTax);
    const lowestFareWithTax = Math.min(...fares.flat());
    return lowestFareWithTax;
  }

  private forceArray(object) {
    if (!Array.isArray(object)) {
      object = [object];
    }
    return object;
  }

  private getFlightsWithLowestFarePricePublic(jsonData, fares) {
    jsonData.flightSegments.flightSegment = this.forceArray(jsonData.flightSegments.flightSegment);
    //const visibleFare = fares.find(({ show }) => show);
    const flightSegments = jsonData.flightSegments.flightSegment;
    const segmentDetails = jsonData.segmentDetails.segmentDetail;
    const flights = flightSegments
      .map((flightSegment) => {
        let fareTypes = flightSegment.fareTypes.fareType;
        const segmentDetail = Array.isArray(segmentDetails)
          ? segmentDetails.find(
              ({ LFID, operatingCarrier }) =>
                LFID === flightSegment?.LFID &&
                AirlinesValid.some((airlineValid: string) => airlineValid == operatingCarrier)
            )
          : segmentDetails.LFID === flightSegment?.LFID
          ? segmentDetails
          : null;

        fareTypes = this.forceArray(fareTypes);

        const lowestFarePriceWithTax = this.getLowestFareWithTax(fareTypes);

        return {
          LFID: flightSegment.LFID,
          departureDate: flightSegment.departureDate,
          lowestFarePriceWithTax,
        };
      })
      .filter(Boolean);
    return flights;
  }

  public async getFareQuotePublicRemote(fareQuoteDto: any): Promise<any> {
    //genero token
    const token = await this.authService.retrieveSecurityToken();

    let jsonRadixxResponse: any;

    const radixxResponse = await this.fareQuotesRemoteRepository.getFareQuotePublicRemote(
      fareQuoteDto,
      token,
      'public'
    );

    const exception = await this.jsonLogger.processException(
      radixxResponse,
      'RetrieveFareQuoteResponse',
      'RetrieveFareQuoteResult'
    );
    if (exception.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(exception);
    }

    jsonRadixxResponse = this.processJsonResponse(
      radixxResponse,
      'RetrieveFareQuoteResponse',
      'RetrieveFareQuoteResult'
    );
    if (jsonRadixxResponse.flightSegments == null) {
      return {
        flights: [],
      };
    }
    
    const segmentDetails = jsonRadixxResponse.segmentDetails.segmentDetail;

    const flightsWithFareQuotes = await Promise.all(
      segmentDetails.map(async (segmentDetail) => {
  
        // Construir el objeto fareQuoteDto con los datos necesarios
        const fareQuoteDto2 = {
          currencyCode: fareQuoteDto.currencyCode,
          date: moment(segmentDetail.departureDate).format('YYYY-MM-DD'),
          promotionalCode: fareQuoteDto.promotionalCode,
          fares: [
            {
              originCode: segmentDetail.origin,
              destinationCode: segmentDetail.destination,
              departureDate: moment(segmentDetail.departureDate).format('YYYY-MM-DD'),
              arrivalDate: moment(segmentDetail.arrivalDate).format('YYYY-MM-DD'),
              languageCode: fareQuoteDto.languageCode,
              show: true,
              passengers: [
                {
                  passengerTypeID: 1,
                  totalSeatsRequired: 1,
                }
              ]
              // Puedes añadir otros campos necesarios según los requerimientos de getFareQuoteShow
            },
          ],
        };
  
        // Llamar a la función getFareQuoteShow para obtener las tarifas del vuelo
        try {

          const flights = await this.getFareQuoteShow(fareQuoteDto2, token, 'public');

          // Verificación: asegurar que fareInfo siempre sea un array
          flights.forEach((flight: any) => {
            if (flight.fareTypes && Array.isArray(flight.fareTypes.fareType)) {
              flight.fareTypes.fareType.forEach((fareType: any) => {
                if (fareType.fareInfos && fareType.fareInfos.fareInfo) {
                  // Verifica si fareInfo no es un array y lo convierte en uno
                  if (!Array.isArray(fareType.fareInfos.fareInfo)) {
                    fareType.fareInfos.fareInfo = [fareType.fareInfos.fareInfo];
                  }
                }
              });
            }
          });

          return {
            LFID: segmentDetail.LFID,
            departureDate: segmentDetail.departureDate,
            flights, // Añade las tarifas y detalles obtenidos
          };
        } catch (error) {
          console.error('Error al obtener tarifas para el vuelo:', error);
          return segmentDetail.departureDate; // O maneja el error según tus necesidades
        }
      })
    );
  
    // Filtrar los resultados válidos y retornar
    return flightsWithFareQuotes;

  }


  private getFlightsForDateShow(dateStart, dateEnd, jsonData) {
    jsonData.flightSegments.flightSegment = this.forceArray(jsonData.flightSegments.flightSegment);

    const flightSegments = jsonData.flightSegments.flightSegment;
    const flights = flightSegments.filter(
      (flightSegment) => moment(flightSegment.departureDate).format('YYYY-MM-DD') == dateStart || moment(flightSegment.departureDate).format('YYYY-MM-DD') == dateEnd
    );

    // Ordenamos los vuelos por la fecha de salida más próxima
    flights.sort((a, b) => {
      return moment(a.departureDate).diff(moment(b.departureDate));
    });
    
    return flights;
  }

  public async getFareQuoteShow(fareQuoteDto: any, firebaseToken: string, user: string): Promise<any> {
    console.log(1);
    const token = await this.authService.retrieveSecurityToken();
    
    if (fareQuoteDto.hasOwnProperty('date')) {
      fareQuoteDto = plainToInstance(FareQuoteDetailsDto, fareQuoteDto) as FareQuoteDetailsDto;
    } else {
      fareQuoteDto = plainToInstance(FareQuoteDto, fareQuoteDto) as FareQuoteDto;
    }

    let jsonRadixxResponse: any;
    if(fareQuoteDto.fares[1]){
      const radixxResponse = await this.fareQuotesRemoteRepository.getFareQuoteDateRangeRemote(
        fareQuoteDto,
        token,
        user
      );
      jsonRadixxResponse = this.processJsonResponse(
        radixxResponse,
        'RetrieveFareQuoteDateRangeResponse',
        'RetrieveFareQuoteDateRangeResult'
      );
      const exception = await this.jsonLogger.processException(
        radixxResponse,
        'RetrieveFareQuoteDateRangeResponse',
        'RetrieveFareQuoteDateRangeResult'
      );
      if (exception.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(exception);
      }

      if (jsonRadixxResponse.flightSegments == null) {
        return {
          flights: [],
        };
      }

      const flights = this.getFlightsForDateShow(fareQuoteDto.fares[0].departureDate, fareQuoteDto.fares[1].departureDate, jsonRadixxResponse);

      return flights;

    }else{
      const radixxResponse = await this.fareQuotesRemoteRepository.getFareQuoteDateRangeRemote(
        fareQuoteDto,
        token,
        user
      );
      jsonRadixxResponse = this.processJsonResponse(
        radixxResponse,
        'RetrieveFareQuoteDateRangeResponse',
        'RetrieveFareQuoteDateRangeResult'
      );
      const exception = await this.jsonLogger.processException(
        radixxResponse,
        'RetrieveFareQuoteDateRangeResponse',
        'RetrieveFareQuoteDateRangeResult'
      );
      if (exception.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(exception);
      }

      if (jsonRadixxResponse.flightSegments == null) {
        return {
          flights: [],
        };
      }

      const flights = this.getFlightsForDate(fareQuoteDto.fares[0].departureDate, jsonRadixxResponse);

      return flights;

    }

  }
    
}
