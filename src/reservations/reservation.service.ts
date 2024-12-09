import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { RetrieveReservationsDto } from './dto/get-reservations.dto';
import { PrismicRemoteRepository } from 'src/prismic/repositories';
import { Formatter } from 'src/utils/xml.formatter';
import {
  FlightOfReservationDto,
  GetExtrasDto,
  GetReservationDetailDto,
  GetReservationDto,
  GetReservationExtrasDto,
  SeatsDto,
} from './dto';
import { ReservationRemoteRepository } from './reservation.remote-repository';
import { SeatsConditions } from 'src/config/iberoJet/seats-conditions';
import { Languages } from 'src/prismic/entities/enum';
import { ExtrasCondition } from 'src/config/iberoJet/taxes-conditions';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { GetAARQuote } from 'src/prismic/dto';
import { converterReservationList } from './converter/converterReservationList';
import { converterReservation } from './converter/converterReservation';
import { SlicesType } from './entities';
import { addServicesByType } from './utils/formatter';
import { ReservationResponseDto } from './responsesDto/get-reservation.dto';
import { ApisInfoRemoteRepository } from 'src/pnr/apisInfo.remote-repository';
import { JsonLogger } from 'src/utils/json-logger';
import { StatusCode } from 'src/enums/status-codes.enum';
import { StatsdService } from 'src/statsd/statsd.service';
import { GetReservationsResponseDto } from './responsesDto/get-reservations.dto';
import { ExtraOption, FlightWithExtras, GetExtrasResponse } from './responsesDto/get-extras.dto';
import { ReservationSeatResponse } from './responsesDto/seats.dto';

@Injectable()
export class ReservationService {
  constructor(
    private remoteRepository: ReservationRemoteRepository,
    private authService: AuthService,
    private prismicRemoteRepository: PrismicRemoteRepository,
    private fareQuotesService: FareQuotesService,
    private apisInfoRemoteRepository: ApisInfoRemoteRepository,
    private jsonLogger: JsonLogger,
    private statsdService: StatsdService
  ) {}

  private availableResponseMapper(response: any, objectName: string, propertyName: string) {
    const responseData = response['s:Body'][objectName][propertyName];
    const stringToSearch = 'a:';
    const replacer = new RegExp(stringToSearch, 'g');
    const json = JSON.parse(JSON.stringify(responseData).replace(replacer, ''));
    delete json.$;
    delete json.Exceptions;
    return Formatter.JSONPropertiesToLowerCamel(json);
  }

  public async getReservation({ confirmationNumber }: GetReservationDto, token: string) {
    return await this.remoteRepository.retrievePnr({ token, confirmationNumber }, token);
  }

  public async retrieveReservations(
    retrieveReservationsDto: RetrieveReservationsDto,
    firebaseToken: string
  ): Promise<GetReservationsResponseDto[]> {
    const reservationsResponse = [];
    const { lang } = retrieveReservationsDto;
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const prismicstart = Date.now();
    const body = await this.prismicRemoteRepository.destinationAiportImages({ lang });
    const { airports } = await this.prismicRemoteRepository.getAirports({ lang });
    const airportsDestinationImages = body.filter(({ slice_type }) => slice_type === SlicesType.PRODUCT_GALLERY);
    const prismicEnd = Date.now();
    await this.statsdService.timing('_reservation_list_prismic_response_time', prismicEnd - prismicstart);
    const { disableWebCheckinForSsrs } = await this.prismicRemoteRepository.getAdminPortal({ lang });

    for (const reservation of retrieveReservationsDto.reservations) {
      const reservationStart = Date.now();
      const response = await this.getReservation(reservation, token);
      const reservationEnd = Date.now();
      await this.statsdService.timing('_reservation_list_response_time', reservationEnd - reservationStart);
      if (response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']) {
        const retrievePnrException = await this.jsonLogger.processException(
          response,
          'RetrievePNRResponse',
          'RetrievePNRResult'
        );

        if (retrievePnrException.getStatus() !== StatusCode.SUCCESS) {
          this.statsdService.timing('_radixx_error', 4000);
          return Promise.reject(retrievePnrException);
        }

        const formattedReservation = converterReservationList(
          response,
          reservation.lastName,
          disableWebCheckinForSsrs,
          airports,
          airportsDestinationImages[0]
        );
        if (formattedReservation) reservationsResponse.push(formattedReservation);
      }
    }

    if (!reservationsResponse.length) return [];
    return reservationsResponse;
  }

  public async retrieveReservation(
    getReservationDto: GetReservationDetailDto,
    firebaseToken: string,
    isLastNameRequired = true,
    user: string
  ): Promise<ReservationResponseDto> {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const reservationStart = Date.now();
    const response = await this.getReservation(getReservationDto, token);
    const reservationEnd = Date.now();
    await this.statsdService.timing('_reservation_response_time', reservationEnd - reservationStart);
    if (!response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']) return null;

    const retrievePnrException = await this.jsonLogger.processException(
      response,
      'RetrievePNRResponse',
      'RetrievePNRResult'
    );

    if (retrievePnrException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(retrievePnrException);
    }

    const { lang } = getReservationDto;
    const prismicstart = Date.now();
    const body = await this.prismicRemoteRepository.destinationAiportImages({ lang });
    const airportsDestinationImages = body.filter(({ slice_type }) => slice_type === SlicesType.PRODUCT_GALLERY);
    const { disableWebCheckinForSsrs } = await this.prismicRemoteRepository.getAdminPortal({ lang });
    const { airports } = await this.prismicRemoteRepository.getAirports({ lang });
    const packages = await this.prismicRemoteRepository.getPackages({ lang });

    const { services: extras } = await this.prismicRemoteRepository.getServicesPlain({ lang: Languages['PT-PT'] });

    const { options: prismicOptions } = await this.prismicRemoteRepository.getOptionsAndSsrs({
      lang,
    }); // Retrieve Prismic options and ssrs using prismicRemoteRepository.

    const prismicEnd = Date.now();
    await this.statsdService.timing('_reservation_prismic_response_time', prismicEnd - prismicstart);

    const apiInfoStart = Date.now();
    const apisInfoResponse = await this.apisInfoRemoteRepository.retrieveApisInfo(
      {
        token,
        confirmationNumber: getReservationDto.confirmationNumber,
      },
      user
    );
    const apiInfoSEnd = Date.now();
    await this.statsdService.timing('_reservation_api_info_response_time', apiInfoSEnd - apiInfoStart);

    const apisInfoException = await this.jsonLogger.processException(
      apisInfoResponse,
      'RetrieveApisInfoResponse',
      'RetrieveApisInfoResult'
    );
    if (apisInfoException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(apisInfoException);
    }

    const apisInfo =
      apisInfoResponse['s:Body'].RetrieveApisInfoResponse.RetrieveApisInfoResult['a:ApisInfos']['a:ApisInformation'];

    const formattedReservation = converterReservation({
      response,
      lastName: getReservationDto.lastName,
      disableWebCheckinForSsrs,
      airports,
      airportImages: airportsDestinationImages[0]?.items,
      isLastNameRequired,
      apisInfo: Array.isArray(apisInfo) ? apisInfo : [apisInfo].filter(Boolean),
      packages,
      extras,
      prismicOptions,
    });
    return formattedReservation;
  }

  public async retrieveReservationExtrasSummary(
    getReservationDto: GetReservationDetailDto,
    firebaseToken: string,
    isLastNameRequired = true,
    user: string
  ): Promise<ReservationResponseDto> {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const reservationStart = Date.now();
    const response = await this.getReservation(getReservationDto, token);
    const reservationEnd = Date.now();
    await this.statsdService.timing('_reservation_response_time', reservationEnd - reservationStart);
    if (!response['s:Body']['RetrievePNRResponse']['RetrievePNRResult']['a:Airlines']) return null;

    const retrievePnrException = await this.jsonLogger.processException(
      response,
      'RetrievePNRResponse',
      'RetrievePNRResult'
    );

    if (retrievePnrException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(retrievePnrException);
    }

    const { lang } = getReservationDto;
    const prismicstart = Date.now();
    const body = await this.prismicRemoteRepository.destinationAiportImages({ lang });
    const airportsDestinationImages = body.filter(({ slice_type }) => slice_type === SlicesType.PRODUCT_GALLERY);
    const { disableWebCheckinForSsrs } = await this.prismicRemoteRepository.getAdminPortal({ lang });
    const { airports } = await this.prismicRemoteRepository.getAirports({ lang });
    const packages = await this.prismicRemoteRepository.getPackages({ lang });

    const { services: extras } = await this.prismicRemoteRepository.getServicesPlain({ lang: Languages['PT-PT'] });

    const { options: prismicOptions } = await this.prismicRemoteRepository.getOptionsAndSsrs({
      lang,
    }); // Retrieve Prismic options and ssrs using prismicRemoteRepository.

    const prismicEnd = Date.now();
    await this.statsdService.timing('_reservation_prismic_response_time', prismicEnd - prismicstart);

    const apiInfoStart = Date.now();
    const apisInfoResponse = await this.apisInfoRemoteRepository.retrieveApisInfo(
      {
        token,
        confirmationNumber: getReservationDto.confirmationNumber,
      },
      user
    );
    const apiInfoSEnd = Date.now();
    await this.statsdService.timing('_reservation_api_info_response_time', apiInfoSEnd - apiInfoStart);

    const apisInfoException = await this.jsonLogger.processException(
      apisInfoResponse,
      'RetrieveApisInfoResponse',
      'RetrieveApisInfoResult'
    );
    if (apisInfoException.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(apisInfoException);
    }

    const apisInfo =
      apisInfoResponse['s:Body'].RetrieveApisInfoResponse.RetrieveApisInfoResult['a:ApisInfos']['a:ApisInformation'];

    const formattedReservation = converterReservation({
      response,
      lastName: getReservationDto.lastName,
      disableWebCheckinForSsrs,
      airports,
      airportImages: airportsDestinationImages[0]?.items,
      isLastNameRequired,
      apisInfo: Array.isArray(apisInfo) ? apisInfo : [apisInfo].filter(Boolean),
      packages,
      extras,
      prismicOptions,
    });
    return formattedReservation;
  }

  public async retrieveAARQuote(getAARQuote: GetAARQuote, firebaseToken: string, user: string) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);

    const { passengerTypeID, fareBasisCode, fareClassCode } = getAARQuote;
    const aarQuoteResponse = await this.remoteRepository.retrieveAARQuote(
      {
        ...getAARQuote,
        passengers: passengerTypeID.map((passengerTypeID) => {
          return {
            passengerTypeID,
          };
        }),
        token,
        fareBasisCode,
        fareClassCode,
      },
      user
    );

    const exception = await this.jsonLogger.processException(
      aarQuoteResponse,
      'RetrieveAARQuoteResponse',
      'RetrieveAARQuoteResult'
    );
    if (exception.getStatus() !== StatusCode.SUCCESS) {
      this.statsdService.timing('_radixx_error', 4000);
      return Promise.reject(exception);
    }

    const { viewAARQuote } = this.availableResponseMapper(
      aarQuoteResponse,
      'RetrieveAARQuoteResponse',
      'RetrieveAARQuoteResult'
    ).serviceQuotes;

    return viewAARQuote;
  }

  public async getReservationExtras(
    getReservationExtras: GetReservationExtrasDto,
    firebaseToken: string,
    user: string
  ) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const { lang } = getReservationExtras;
    const reservation = await this.retrieveReservation(getReservationExtras, firebaseToken, false, user);
    if (reservation instanceof ReservationResponseDto && reservation !== null && reservation !== undefined)
      return new HttpException('Flight not found.', HttpStatus.NOT_FOUND);

    const formattedFlights = reservation.flights.map(async (flight) => {
      const passengers = flight.flights[0].persons;
      const aarQuoteResponse = await this.remoteRepository.retrieveAARQuote(
        {
          airportCode: flight.origin,
          departureDate: flight.departureDate,
          destinationAirportCode: flight.destination,
          logicalFlightID: flight.logicalFlightID,
          fareBasisCode: flight.fareBasisCode,
          fareClassCode: flight.fareClassCode,
          ...getReservationExtras,
          passengers,
          token,
        },
        user
      );

      const ARRQuoteexception = await this.jsonLogger.processException(
        aarQuoteResponse,
        'RetrieveAARQuoteResponse',
        'RetrieveAARQuoteResult'
      );

      if (ARRQuoteexception.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(ARRQuoteexception);
      }

      const ARRQuote = this.availableResponseMapper(
        aarQuoteResponse,
        'RetrieveAARQuoteResponse',
        'RetrieveAARQuoteResult'
      );

      if (!ARRQuote.serviceQuotes) return { logicalFlightID: flight.logicalFlightID, extras: [] };

      const { viewAARQuote } = ARRQuote.serviceQuotes;
      const { options: prismicOptions, ssrs: prismicSsrs } = await this.prismicRemoteRepository.getOptionsAndSsrs({
        lang,
      }); // Retrieve Prismic options and ssrs using prismicRemoteRepository.

      const extrasImages = await this.prismicRemoteRepository.extrasImages({ lang });
      const { services: extras } = await this.prismicRemoteRepository.getServicesPlain({ lang: Languages['PT-PT'] });
      return {
        logicalFlightID: flight.logicalFlightID,
        extras: extras
          .map(({ options, id, header }) => {
            const prismicSsr = prismicSsrs.find(({ id: ssrId }) => ssrId === id); // Get the Prismic ssr based on ssrId and id.
            const title = prismicSsr?.title || header;
            const icon = prismicSsr?.icon?.url;
            const taxCondition = ExtrasCondition.modify.find(({ id: extraConditionID }) => extraConditionID === id);
            const mobileIcon = extrasImages.find(({ title: mobileTitle }) => parseInt(mobileTitle[0]?.text) == id);
            const shortDescription = prismicSsr?.description[0]?.text;
            const image = 'https://digittal.es/imageToBeReplaced.svg';
            let includedSummary = 0;
            const serviceOptions = options
              .map(({ code, id: optionId, maxQuantity, icon: iconOfOption }) => {
                const radixxOption = viewAARQuote.find(({ SSRCode }) => SSRCode === code);
                if (!radixxOption) {
                  return null;
                }
                const passengerTypesAvailable = [];
                const { amount, quantityAvailable, serviceActive, refundable, commissionable, serviceID, categoryID } =
                  radixxOption;
                const prismicOption = prismicOptions.find(
                  ({ ssrId, id: prismicOptionId }) => ssrId === id && prismicOptionId === optionId
                ); // Get the Prismic option based on ssrId, id, and prismicOptionId.

                const passengersIncluded = passengers
                  .map(({ passengerTypeID, services, personOrgID, checkinStatus }) => {
                    let included = 0;

                    const servicesByType = addServicesByType(services);

                    // Find the specific object in the viewAARQuote array
                    const AArQuote = viewAARQuote.find(
                      ({ PTCID, SSRCode }) => PTCID === passengerTypeID && SSRCode === code
                    );

                    if (!AArQuote || (AArQuote && AArQuote?.quantityAvailable == '0') || checkinStatus) return null;

                    if (
                      !passengerTypesAvailable.some(
                        (passengerTypeAvailable: number) => passengerTypeAvailable == Number(passengerTypeID)
                      )
                    )
                      passengerTypesAvailable.push(Number(passengerTypeID));
                    const service = servicesByType.find((service) => service.code === code);
                    if (service) included += service.quantity;

                    // add included value to includedSummary
                    includedSummary += included;

                    // return an object with key and included properties
                    return {
                      key: personOrgID,
                      included,
                    };
                  })
                  .filter(Boolean);

                if (!passengerTypesAvailable.length) return null;
                if (!passengersIncluded.length) return null;

                const quantityWithoutPay = passengersIncluded
                  .map(({ included, key }) => {
                    if (![5, 9].includes(id)) return null;
                    return {
                      id: key,
                      quantity: [9].includes(id) ? included : 0,
                    };
                  })
                  .filter(Boolean);

                return {
                  title: '',
                  description: '',
                  ssrId: id,
                  ...prismicOption,
                  id: optionId,
                  code,
                  mobileIcon: mobileIcon?.image?.url,
                  maxQuantity,
                  amount,
                  quantityWithoutPay,
                  icon: iconOfOption,
                  serviceID,
                  categoryID,
                  quantityAvailable,
                  serviceActive,
                  refundable: refundable === 'true',
                  commissionable: commissionable === 'true',
                  passengerTypesAvailable,
                  passengersIncluded,
                };
              })
              .filter(Boolean); // Remove null values from the serviceOptions array.

            if (!serviceOptions.length) return null;

            const type =
              serviceOptions.length > 1 ? taxCondition.typeWithOptions || taxCondition?.type : taxCondition?.type;

            if (serviceOptions.length > 1)
              return {
                ssrId: id,
                title,
                mobileIcon: mobileIcon?.image?.url,
                shortDescription,
                description: shortDescription,
                icon,
                type,
                image,
                includedSummary,
                quantityWithoutPay:
                  serviceOptions.find((option) => option.quantityWithoutPay.some(({ quantity }) => quantity))
                    ?.quantityWithoutPay || serviceOptions[0].quantityWithoutPay,
                options: serviceOptions,
              };

            return {
              ssrId: id,
              title,
              mobileIcon: mobileIcon?.image?.url,
              shortDescription,
              image,
              type,
              options: [],
              includedSummary,
              ...serviceOptions[0],
              icon,
            };
          })
          .filter(Boolean)
          .sort((a, b) => {
            return a.ssrId - b.ssrId;
          }),
      };
    });

    const flighWithExtras = await Promise.all(formattedFlights);

    return { flights: flighWithExtras.filter(Boolean) };
  }

  public async getExtras(
    getReservationExtras: GetExtrasDto,
    firebaseToken: string,
    user: string
  ): Promise<GetExtrasResponse> {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    const { lang, passengers, flights } = getReservationExtras;

    const formattedFlights = flights.map(async (flight: FlightOfReservationDto) => {
      const { logicalFlightID, serviceBundle, fareBundle } = flight;
      const aarQuoteResponse = await this.remoteRepository.retrieveAARQuote(
        {
          ...flight,
          ...getReservationExtras,
          token,
        },
        user
      );

      const AArQuotestart = Date.now();
      const ARRQuoteexception = await this.jsonLogger.processException(
        aarQuoteResponse,
        'RetrieveAARQuoteResponse',
        'RetrieveAARQuoteResult'
      );
      const AArQuoteEnd = Date.now();
      await this.statsdService.timing('_extras_AArQuote_response_time', AArQuoteEnd - AArQuotestart);

      if (ARRQuoteexception.getStatus() !== StatusCode.SUCCESS) {
        this.statsdService.timing('_radixx_error', 4000);
        return Promise.reject(ARRQuoteexception);
      }
      const { viewAARQuote } = this.availableResponseMapper(
        aarQuoteResponse,
        'RetrieveAARQuoteResponse',
        'RetrieveAARQuoteResult'
      ).serviceQuotes;

      if (!viewAARQuote) return Promise.reject(ARRQuoteexception);

      const serviceBundleStart = Date.now();
      const serviceBundleDetails = serviceBundle
        ? await this.fareQuotesService.getServiceBundleDetails(serviceBundle, firebaseToken, user)
        : null;
      const serviceBundleEnd = Date.now();
      await this.statsdService.timing('_extras_service_bundle_response_time', serviceBundleEnd - serviceBundleStart);

      const fareBundleStart = Date.now();
      const fareBundleDetails = fareBundle
        ? await this.fareQuotesService.getFareBundleDetails(fareBundle, firebaseToken, user)
        : null;
      const fareBundleEnd = Date.now();
      await this.statsdService.timing('_extras_fare_bundle_response_time', fareBundleEnd - fareBundleStart);

      const serviceBundles = serviceBundleDetails?.bundleServiceDetails?.bundleServiceDetail || {};
      const fareBundles = fareBundleDetails?.bundleServiceDetails?.bundleServiceDetail || {};

      const prismicstart = Date.now();
      const extrasImages = await this.prismicRemoteRepository.extrasImages({ lang });
      const { options: prismicOptions, ssrs: prismicSsrs } = await this.prismicRemoteRepository.getOptionsAndSsrs({
        lang,
      }); // Retrieve Prismic options and ssrs using prismicRemoteRepository.
      const { services: extras } = await this.prismicRemoteRepository.getServicesPlain({ lang: Languages['PT-PT'] });
      const prismicEnd = Date.now();
      await this.statsdService.timing('_extras_prismic_response_time', prismicEnd - prismicstart);

      const services: ExtraOption[] = extras
        .map(({ options, id, header }) => {
          const prismicSsr = prismicSsrs.find(({ id: ssrId }) => ssrId === id); // Get the Prismic ssr based on ssrId and id.
          const title = prismicSsr?.title || header;
          const icon = prismicSsr?.icon?.url;
          const mobileIcon = extrasImages.find(({ title: mobileTitle }) => parseInt(mobileTitle[0]?.text) == id);
          const taxCondition = ExtrasCondition.create.find(({ id: extraConditionID }) => extraConditionID === id);
          const shortDescription = prismicSsr?.description[0]?.text;
          const image = 'https://digittal.es/imageToBeReplaced.svg';
          let includedSummary = 0;
          const optionsGroupIndex = [];
          const serviceOptions = options
            .map(({ code, id: optionId, maxQuantity, icon: iconOfOption }) => {
              const radixxOption = viewAARQuote.find(({ SSRCode }) => SSRCode === code);
              if (!radixxOption) {
                return null;
              }
              const passengerTypesAvailable = [];
              const { amount, quantityAvailable, serviceActive, refundable, commissionable, serviceID, categoryID } =
                radixxOption;

              const prismicOption = prismicOptions.find(
                ({ ssrId, id: prismicOptionId }) => ssrId === id && prismicOptionId === optionId
              ); // Get the Prismic option based on ssrId, id, and prismicOptionId.

              const serviceBundleElement = Array.isArray(serviceBundles)
                ? serviceBundles.find(({ ssrCode }) => ssrCode === code)
                : serviceBundles.ssrCode === code
                ? serviceBundles
                : null;

              const fareBundleElement = Array.isArray(fareBundles)
                ? fareBundles.find(({ ssrCode }) => ssrCode === code)
                : fareBundles.ssrCode === code
                ? fareBundles
                : null;

              const passengersIncluded = passengers
                .map(({ key, passengerTypeID }) => {
                  let included = 0;

                  const hasServiceBundle = viewAARQuote.some(
                    ({ PTCID, SSRCode }) => PTCID === passengerTypeID && SSRCode === serviceBundle
                  );

                  // Find the specific object in the viewAARQuote array
                  const AArQuote = viewAARQuote.find(
                    ({ PTCID, SSRCode }) => PTCID === passengerTypeID && SSRCode === code
                  );
                  // Check if object is not found or has quantityAvailable property with value of 0
                  if (!AArQuote || (AArQuote && AArQuote?.quantityAvailable == '0')) return null;
                  // return null if either condition is true

                  if (
                    !passengerTypesAvailable.some(
                      (passengerTypeAvailable: number) => passengerTypeAvailable == Number(passengerTypeID)
                    )
                  )
                    passengerTypesAvailable.push(Number(passengerTypeID));
                  included += fareBundleElement
                    ? optionsGroupIndex.some(
                        ({ bundleGroupIndex, bundleQtyGroupIndex }) =>
                          bundleGroupIndex === fareBundleElement?.bundleGroupIndex &&
                          bundleQtyGroupIndex === fareBundleElement?.bundleQtyGroupIndex
                      )
                      ? 0
                      : parseInt(fareBundleElement.bundleQtyGroupIndex)
                    : 0;

                  if (!hasServiceBundle) {
                    // add included value to includedSummary
                    includedSummary += included;
                    return {
                      key,
                      included,
                      serviceBundle: null,
                    };
                  }

                  // calculate value for included based on the type of data in serviceBundles and fareBundles
                  included += serviceBundleElement
                    ? optionsGroupIndex.some(
                        ({ bundleGroupIndex, bundleQtyGroupIndex }) =>
                          bundleGroupIndex === serviceBundleElement?.bundleGroupIndex &&
                          bundleQtyGroupIndex === serviceBundleElement?.bundleQtyGroupIndex
                      )
                      ? 0
                      : parseInt(serviceBundleElement.bundleQtyGroupIndex)
                    : 0;

                  // add included value to includedSummary
                  includedSummary += included;

                  // return an object with key and included properties
                  return {
                    key,
                    included,
                    serviceBundle: included
                      ? {
                          SSRCode: serviceBundle,
                          quantity: 1,
                        }
                      : null,
                  };
                })
                .filter(Boolean);

              if (serviceBundles) {
                if (serviceBundleElement)
                  optionsGroupIndex.push({
                    bundleGroupIndex: serviceBundleElement.bundleGroupIndex,
                    bundleQtyGroupIndex: serviceBundleElement.bundleQtyGroupIndex,
                  });
              }

              if (fareBundles) {
                if (fareBundleElement)
                  optionsGroupIndex.push({
                    bundleGroupIndex: fareBundleElement.bundleGroupIndex,
                    bundleQtyGroupIndex: fareBundleElement.bundleQtyGroupIndex,
                  });
              }

              if (!passengerTypesAvailable.length) return null;
              const quantityWithoutPay = passengersIncluded
                .map(({ included, key }) => {
                  if (![5, 9].includes(id)) return null;
                  return {
                    id: key,
                    quantity: [5, 9].includes(id) ? included : 0,
                  };
                })
                .filter(Boolean);
              return {
                title: '',
                description: '',
                ssrId: id,
                ...prismicOption,
                id: optionId,
                quantityWithoutPay,
                code,
                maxQuantity,
                amount,
                icon: iconOfOption,
                serviceID,
                categoryID,
                quantityAvailable,
                serviceActive,
                refundable: refundable === 'true',
                commissionable: commissionable === 'true',
                passengerTypesAvailable,
                passengersIncluded,
              };
            })
            .filter(Boolean); // Remove null values from the serviceOptions array.

          if (!serviceOptions.length) return null;

          const type =
            serviceOptions.length > 1 ? taxCondition.typeWithOptions || taxCondition?.type : taxCondition?.type;
          if (serviceOptions.length > 1)
            return {
              ssrId: id,
              title,
              type,
              mobileIcon: mobileIcon?.image?.url,
              shortDescription,
              description: shortDescription,
              icon,
              image,
              includedSummary,
              quantityWithoutPay:
                serviceOptions.find((option) => option.quantityWithoutPay.some(({ quantity }) => quantity))
                  ?.quantityWithoutPay || serviceOptions[0].quantityWithoutPay,
              options: serviceOptions,
            };

          return {
            ssrId: id,
            title,
            type,
            mobileIcon: mobileIcon?.image?.url,
            shortDescription,
            image,
            options: [],
            includedSummary,
            ...serviceOptions[0],
            icon,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.ssrId - b.ssrId);
      return { logicalFlightID, extras: services };
    });

    const flighWithExtras = await Promise.all(formattedFlights);

    return { flights: flighWithExtras };
  }

  public async seats({ flights, passengers }: SeatsDto): Promise<ReservationSeatResponse> {
    return {
      flights: flights.map(({ fare, touristPlus, logicalFlightID }) => {
        return {
          logicalFlightID,
          passengers: passengers.map((passenger: string) => {
            const seatCondition = touristPlus ? SeatsConditions['touristPlus'] : SeatsConditions[fare];
            return {
              key: passenger,
              ...seatCondition,
            };
          }),
        };
      }),
    };
  }
}
