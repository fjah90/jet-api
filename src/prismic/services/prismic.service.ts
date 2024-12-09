import { Injectable } from '@nestjs/common';
import { PrismicRemoteRepository } from '../repositories';
import {
  getNoCheckInResponse,
  GetSpecialFoodResponse,
  GetCubaVisaMessageResponse,
  GetAirportsResponse,
  GetSeatsResponse,
  ElementOfDocumentResponse,
  GetPassengersConditionsResponse,
  GetTermsAndConditionsTextResponse,
  HomeVideoDto,
} from '../responsesDto';
import { GetSecurityQuestionPayloadDto, GetDocumentByLanguageDto, GetTouristInfoDto, GetPrismicSeatsDto } from '../dto';
import { Services } from 'src/config/iberoJet/services';
import { FareQuotesService } from 'src/fare-quotes/fare-quotes.service';
import { CurrencySymbols } from '../utils/currencies';
import { generateText } from '../utils/formatter';
import { securityQuestionText } from '../utils/formatterSecurityQuestion';
import { customSeats, prismicSeatsColors } from '../utils/seatsColors';
import { ReservationService } from 'src/reservations/reservation.service';
import { GetServicesBundleDto } from '../responsesDto/get-services-bundle.dto';
import { chain, uniq } from 'lodash';
import { Formatter } from 'src/utils/xml.formatter';

@Injectable()
export class PrismicService {
  constructor(
    private prismicRemoteRepository: PrismicRemoteRepository,
    private fareQuotesService: FareQuotesService,
    private reservationService: ReservationService
  ) {}

  async getSecurityQuestion(getSecurityQuestionDto: GetSecurityQuestionPayloadDto): Promise<any> {
    const { elements } = await this.prismicRemoteRepository.getSecurityQuestion(getSecurityQuestionDto);

    return {
      message: securityQuestionText(elements),
      image: elements.find(({ type }) => type == 'image')?.url,
    };
  }

  async retrieveBanners(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<any> {
    return await this.prismicRemoteRepository.retrieveBanners(getDocumentByLanguageDto);
  }

  async getNoCheckIn(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<getNoCheckInResponse> {
    return await this.prismicRemoteRepository.getNoCheckIn(getDocumentByLanguageDto);
  }

  async getSpecialFood(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<GetSpecialFoodResponse> {
    return await this.prismicRemoteRepository.getSpecialFood(getDocumentByLanguageDto);
  }
  async getCubaVisaMessage(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<GetCubaVisaMessageResponse> {
    return await this.prismicRemoteRepository.getCubaVisaMessage(getDocumentByLanguageDto);
  }

  async getAirports(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<GetAirportsResponse> {
    return await this.prismicRemoteRepository.getAirports(getDocumentByLanguageDto);
  }

  async getSeats(getPrismicSeatsDto: GetPrismicSeatsDto): Promise<GetSeatsResponse> {
    const { seats } = await this.prismicRemoteRepository.getSeats(getPrismicSeatsDto);

    const prismicSeatsWithColor = seats
      .map(({ code: seatCode, description }) => {
        if (!getPrismicSeatsDto.seatCodes.some((code: string) => code === seatCode)) return null;
        const seatWithColor = prismicSeatsColors.find(({ code }) => seatCode === code);
        return {
          code: seatCode,
          description,
          color: seatWithColor?.color || '#0069AD',
        };
      })
      .filter(Boolean);

    const customizedSeats = customSeats
      .map((seat) => {
        return {
          code: seat.code,
          description: seat[`${getPrismicSeatsDto.lang}-description`],
          color: seat.color || '#0069AD',
        };
      })
      .filter(Boolean);
    return { seats: [...prismicSeatsWithColor, ...customizedSeats] };
  }

  async getPassengersConditions(
    getDocumentByLanguageDto: GetDocumentByLanguageDto
  ): Promise<GetPassengersConditionsResponse> {
    return await this.prismicRemoteRepository.getPassengerCondition(getDocumentByLanguageDto);
  }

  async getJsonWebConfig(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<GetSeatsResponse> {
    return await this.prismicRemoteRepository.getServicesPlain(getDocumentByLanguageDto);
  }

  async getPackages(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<ElementOfDocumentResponse> {
    return await this.prismicRemoteRepository.getPackages(getDocumentByLanguageDto);
  }

  async getServiceBundle(
    getServiceBundleDto: GetTouristInfoDto,
    firebaseToken: string,
    user: string
  ): Promise<GetServicesBundleDto[]> {
    const { serviceBundles, serviceBundleGroups } = await this.prismicRemoteRepository.getTouristInfo(
      getServiceBundleDto
    );
    const AARQuotes = await this.reservationService.retrieveAARQuote(getServiceBundleDto, firebaseToken, user);

    const AARQuotesFiltered = AARQuotes.filter(
      ({ serviceType, display, serviceActive }) => serviceType === '3' && display == 'true' && serviceActive == 'true'
    );

    const groupedResult = chain(AARQuotesFiltered)
      .groupBy((obj) => `${obj.serviceID}-${obj.logicalFlightID}-${obj.categoryID}-${obj.codeType}`)
      .map((groupedObjs) => {
        const firstObj = groupedObjs[0];
        const PTCIDs = uniq(groupedObjs.map((obj) => parseInt(obj.PTCID)));

        return {
          ...firstObj,
          PTCID: PTCIDs,
        };
      })
      .value();

    return await Promise.all(
      groupedResult.map(
        async ({ logicalFlightID, SSRCode, physicalFlightID, amount, currencyCode, serviceID, categoryID, PTCID }) => {
          const serviceBundleDetails = await this.fareQuotesService.getServiceBundleDetails(
            SSRCode,
            firebaseToken,
            user
          );
          const services = Formatter.forceArray(serviceBundleDetails?.bundleServiceDetails?.bundleServiceDetail);
          return {
            logicalFlightID,
            codeType: SSRCode,
            description: serviceBundles.find(({ code }) => code == SSRCode)?.description,
            serviceID,
            categoryID,
            physicalFlightID,
            amount,
            PTCID,
            currencyCode: CurrencySymbols[currencyCode],
            services: serviceBundleGroups
              .filter(
                ({ applicableBundleCode, standaloneServiceCode }) =>
                  SSRCode === applicableBundleCode && services.some(({ ssrCode }) => ssrCode === standaloneServiceCode)
              )
              .sort((a, b) => a.displayOrder - b.displayOrder),
          };
        }
      )
    );
  }

  async getExtras(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<ElementOfDocumentResponse[] | string> {
    return await this.prismicRemoteRepository.getExtras(getDocumentByLanguageDto);
  }

  async getMenus(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<any> {
    const menus = await this.prismicRemoteRepository.getMenus(getDocumentByLanguageDto);
    const { options } = Services.find(({ id }) => id === 5);

    return menus.map((menu) => {
      const option = options.find((element) => element.id === menu.id);
      return { ...menu, ...option };
    });
  }

  async getDoc(getDocumentByLanguageDto: GetDocumentByLanguageDto): Promise<any> {
    return await this.prismicRemoteRepository.getDoc(getDocumentByLanguageDto);
  }

  async GetTermsAndConditionsText(
    getDocumentByLanguageDto: GetDocumentByLanguageDto
  ): Promise<GetTermsAndConditionsTextResponse> {
    const { hazardousMaterialsCheckboxText } = await this.prismicRemoteRepository.getPassengers(
      getDocumentByLanguageDto
    );
    return {
      message: generateText(hazardousMaterialsCheckboxText, getDocumentByLanguageDto.lang.split('-')[0]),
    };
  }

  async getHomeVideo(): Promise<HomeVideoDto> {
    return { link: process.env.HOME_VIDEO_LINK };
  }
}
