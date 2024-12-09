import { client } from '../config/prismicConfig';
import {
  GetSecurityQuestionResponse,
  GetBannerResponse,
  getNoCheckInResponse,
  GetSpecialFoodResponse,
  GetCubaVisaMessageResponse,
  GetAirportsResponse,
  GetSeatsResponse,
  ElementOfDocumentResponse,
  GetPassengersConditionsResponse,
} from '../responsesDto';
import { GetSecurityQuestionPayloadDto, GetDocumentByLanguageDto, GetPrismicSeatsDto } from '../dto';
import { Parser } from 'src/utils/json-xml.parser';
import { Languages } from '../entities/enum';
import { StatsdService } from 'src/statsd/statsd.service';
import { Configuration } from 'src/statsd/interface/configuration.interface';
import { ConfigService } from '@nestjs/config';
export class PrismicRemoteRepository {
  private async getPrismicClient() {
    const statsdService = new StatsdService(new ConfigService<Configuration>());
    const start = Date.now();
    //Create prismic Session
    const prismicClient = await client();
    const end = Date.now();
    await statsdService?.timing('_prismic_response_time', end - start);
    return prismicClient;
  }

  public async retrieveBanners({ lang }: GetDocumentByLanguageDto): Promise<GetBannerResponse> {
    const prismicClient = await this.getPrismicClient();
    const {
      data: { body },
    } = await prismicClient.getSingle('home', { lang });
    const { items } = body.find(({ slice_type }) => slice_type === 'hero_gallery');
    return { links: items.map(({ backgroundImage: { url } }) => url), config: 6000 };
  }

  public async getSecurityQuestion({ id, lang }: GetSecurityQuestionPayloadDto): Promise<GetSecurityQuestionResponse> {
    const prismicClient = await this.getPrismicClient();
    const {
      data: { securityQuestions },
    } = await prismicClient.getSingle('checkin', { lang });
    const { question } = securityQuestions.find((securityQuestion: any) => securityQuestion.id == id);
    return { elements: question, lang };
  }

  public async getNoCheckIn({ lang }: GetDocumentByLanguageDto): Promise<getNoCheckInResponse> {
    const prismicClient = await this.getPrismicClient();
    const {
      data: { checkinUnavailable },
    } = await prismicClient.getSingle('checkin', { lang });
    return { message: checkinUnavailable };
  }

  public async getSpecialFood({ lang }: GetDocumentByLanguageDto): Promise<GetSpecialFoodResponse> {
    const prismicClient = await this.getPrismicClient();
    const {
      data: { options, ssrs },
    } = await prismicClient.getSingle('ibe', { lang });
    const specialFoods = options.filter(({ ssrId }) => ssrId === 9).map(({ title }) => title);
    const { description: specialFoodsTerms } = ssrs.find(({ id }) => id === 9);
    return { specialFoods, specialFoodsTerms };
  }

  public async getCubaVisaMessage({ lang }: GetDocumentByLanguageDto): Promise<GetCubaVisaMessageResponse> {
    const prismicClient = await this.getPrismicClient();
    const {
      data: { options },
    } = await prismicClient.getSingle('ibe', { lang });
    const { description: message } = options.find(({ ssrId }) => ssrId === 10);
    return { message };
  }

  async getAirports({ lang }: GetDocumentByLanguageDto): Promise<GetAirportsResponse> {
    const prismicClient = await this.getPrismicClient();
    const {
      data: { airport: airports },
    } = await prismicClient.getSingle('ibe', { lang });
    return { airports };
  }

  async getSeats({ lang }: GetPrismicSeatsDto): Promise<GetSeatsResponse> {
    const prismicClient = await this.getPrismicClient();
    const {
      data: { seats },
    } = await prismicClient.getSingle('ibe', { lang });
    return { seats };
  }

  async getPassengerCondition({ lang }: GetDocumentByLanguageDto): Promise<GetPassengersConditionsResponse> {
    const prismicClient = await this.getPrismicClient();
    const {
      data: { hazardousMaterialsCheckboxText },
    } = await prismicClient.getSingle('passengers', { lang });
    const message = hazardousMaterialsCheckboxText[0].text;
    return { message };
  }

  async getServicesPlain({ lang }: GetDocumentByLanguageDto): Promise<any> {
    //Create prismic Session
    const prismicClient = await client();

    //Get Document
    const {
      data: { services_plain },
    } = await prismicClient.getSingle('json_webconfig', { lang });

    return await Parser.cleanAndParseJSON(services_plain);
  }

  async getAdminPortal({ lang }: GetDocumentByLanguageDto): Promise<any> {
    //Create prismic Session
    const prismicClient = await client();

    //Get Document
    const {
      data: { json_admin_portal },
    } = await prismicClient.getSingle('json_webconfig', { lang: Languages['PT-PT'] });

    return await Parser.cleanAndParseJSON(json_admin_portal);
  }

  async getPackages({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const {
      data: { fares },
    } = await prismicClient.getSingle('ibe', { lang });

    return fares.map((fare) => {
      return {
        ...fare,
        name: fare.name || fare.title,
      };
    });
  }

  async getTouristInfo({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const {
      data: { serviceBundleGroups, serviceBundles },
    } = await prismicClient.getSingle('ibe', { lang });

    return {
      serviceBundleGroups: serviceBundleGroups.map((serviceBundle) => {
        return { ...serviceBundle, displayOrder: serviceBundle.displayOrder || serviceBundle.bundleGroupIndex };
      }),
      serviceBundles,
    };
  }

  async getExtras({ lang }: GetDocumentByLanguageDto): Promise<ElementOfDocumentResponse[] | string> {
    const prismicClient = await client();
    const {
      data: { ssrs },
    } = await prismicClient.getSingle('ibe', { lang });

    if (!ssrs) return 'Document not found!';
    return ssrs;
  }

  async getMenus({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const {
      data: { options },
    } = await prismicClient.getSingle('ibe', { lang });
    return options.filter(({ ssrId }) => ssrId === 5);
  }

  async getOptionsAndSsrs({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const {
      data: { options, ssrs },
    } = await prismicClient.getSingle('ibe', { lang });
    return { options, ssrs };
  }

  async getDoc({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const data = await prismicClient.getAllByType('ibe', { lang });
    return data;
  }

  async destinationAiportImages({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const data = await prismicClient.getAllByType('mobile_app_content', { lang: 'pt-pt' });
    return data[1]?.data?.body;
  }

  async extrasImages({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const data = await prismicClient.getAllByType('mobile_app_content', { lang: 'pt-pt' });
    return data[0]?.data?.body[0]?.items;
  }

  async getHome({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const { data } = await prismicClient.getSingle('home', { lang });
    return data;
  }

  async getExtrasDocument({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const { data } = await prismicClient.getSingle('extras', { lang });
    return data;
  }

  async getPassengers({ lang }: GetDocumentByLanguageDto): Promise<any> {
    const prismicClient = await client();
    const { data } = await prismicClient.getSingle('passengers', { lang });
    return data;
  }
}
