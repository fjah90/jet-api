import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { LanguageDto } from 'src/prismic/dto';
import { AirportResponse } from 'src/prismic/responsesDto';
import { PrismicService } from 'src/prismic/services';
import { FlightsRemoteRepository } from './flights.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { StatusCode } from 'src/enums/status-codes.enum';
import { StatsdService } from 'src/statsd/statsd.service';
import { OriginAndDestinationsResponse } from './responsesDto/get_all_flights.dto';
import { Languages } from 'src/prismic/entities/enum';

@Injectable()
export class FlightsService {
  constructor(
    private flightsRemoteRepository: FlightsRemoteRepository,
    private authService: AuthService,
    private prismicService: PrismicService,
    private jsonLogger: JsonLogger,
    private statsdService: StatsdService
  ) {}

  async retrieveAllFlights(
    languageDto: LanguageDto,
    firebaseToken: string,
    user: string
  ): Promise<OriginAndDestinationsResponse[]> {
    const prismicStart = Date.now();
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const { airports } = await this.prismicService.getAirports(languageDto);
    const { airports: aiportsInSpanish } = await this.prismicService.getAirports({ lang: Languages['ES-ES'] });
    const prismicEnd = Date.now();
    await this.statsdService.timing('_flights_prismic_aiports_response_time', prismicEnd - prismicStart);
    const radixxStart = Date.now();
    const flightsResponse = await this.flightsRemoteRepository.getAllFlights(token as string, languageDto.lang, user);
    const radixxEnd = Date.now();
    await this.statsdService.timing('_flights_aiports_response_time', radixxEnd - radixxStart);
    const exception = await this.jsonLogger.processException(
      flightsResponse,
      'RetrieveAirportRoutesResponse',
      'RetrieveAirportRoutesResult'
    );

    if (exception.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(exception);
    }
    return this.availableRoutesDtoResponseMapper(
      flightsResponse,
      aiportsInSpanish.map(({ code }, index) => {
        return { code, index, name: airports.find(({ code: aiportCode }) => aiportCode === code)?.name };
      })
    );
  }

  private availableRoutesDtoResponseMapper(flights: any, airports: AirportResponse[]): OriginAndDestinationsResponse[] {
    const routes = flights?.['s:Body']?.['RetrieveAirportRoutesResponse']?.['RetrieveAirportRoutesResult']?.['a:Routes']?.['a:Route'];
    if (!routes) {
      throw new Error('Routes data is missing');
    }

    const availableRoutes = [];
    let lastOriginProccesed = '';
    routes.forEach((element) => {
      let originAirport = airports.find(
        (airport: AirportResponse) => airport.code === element?.['a:OriginAirportCode']
      );
      if (!originAirport) {
        originAirport = { index: airports.length, code: element?.['a:OriginAirportCode'], name: '' };
        airports.push(originAirport);
      }

      let destinationAirport = airports.find(
        (airport: AirportResponse) => airport.code === element?.['a:DestinationAirportCode']
      );
      if (!destinationAirport) {
        destinationAirport = { index: airports.length, code: element?.['a:DestinationAirportCode'], name: '' };
        airports.push(destinationAirport);
      }

      if (element?.['a:OriginAirportCode'] === lastOriginProccesed) {
        if (
          availableRoutes[originAirport?.index] &&
          availableRoutes[originAirport?.index]['originAirportCode'] != element?.['a:DestinationAirportCode']
        ) {
          availableRoutes[originAirport?.index]['destinations'][destinationAirport.index] = {
            destinationAirportCode: element?.['a:DestinationAirportCode'],
            destinationAirportName: destinationAirport?.name || element?.['a:DestinationAirportDescription'],
            destinationAirportDescription: element?.['a:DestinationAirportDescription'],
            destinationAirportCountryCode: element?.['a:DestinationAirportISOCountryCode3'],
          };
        }
      } else {
        lastOriginProccesed = element?.['a:OriginAirportCode'];
        const destinations = [];
        destinations[destinationAirport.index] = {
          destinationAirportCode: element?.['a:DestinationAirportCode'],
          destinationAirportDescription: element?.['a:DestinationAirportDescription'],
          destinationAirportName: destinationAirport?.name || element?.['a:DestinationAirportDescription'],
          destinationAirportCountryCode: element?.['a:DestinationAirportISOCountryCode3'],
        };
        availableRoutes[originAirport?.index] = {
          originAirportCode: element?.['a:OriginAirportCode'],
          originAirportDescription: element?.['a:OriginAirportDescription'],
          originAirportAirportName: originAirport?.name || element?.['a:OriginAirportDescription'],
          originAirportCountryCode: element?.['a:OriginAirportISOCountryCode3'],
          destinations,
        };
      }
    });
    return availableRoutes.filter(Boolean).map((availableRoute) => {
      const destinations = availableRoute.destinations.filter(Boolean);
      return { ...availableRoute, destinations };
    });
  }
}
