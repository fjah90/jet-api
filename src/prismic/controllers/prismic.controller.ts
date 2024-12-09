import { Req, Body, Controller, Get, HttpCode, Post, ValidationPipe, UseInterceptors } from '@nestjs/common';
import { PrismicService } from '../services';
import {
  GetSecurityQuestionResponse,
  GetBannerResponse,
  getNoCheckInResponse,
  GetCubaVisaMessageResponse,
  GetSeatsResponse,
  ElementOfDocumentResponse,
  GetTermsAndConditionsTextResponse,
  HomeVideoDto,
} from '../responsesDto';
import { GetSecurityQuestionDto, GetDocumentByLanguageDto, GetTouristInfoDto, GetPrismicSeatsDto } from '../dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { GetServicesBundleDto } from '../responsesDto/get-services-bundle.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Prismic')
@ApiBearerAuth()
@Controller('prismic')
export class PrismicController {
  constructor(private readonly prismicService: PrismicService, private statsdService: StatsdService) {}

  @ApiOperation({
    summary: 'Get Home Video Link',
    description: 'This endpoint Home Video Link.',
  })
  @ApiCreatedResponse({
    description: 'Home video successfully found.',
    type: HomeVideoDto,
  })
  @Get('/home-video')
  async getHomeVideo(): Promise<HomeVideoDto> {
    const start = Date.now();
    const response = await this.prismicService.getHomeVideo();
    const end = Date.now();
    await this.statsdService.timing('_media_getHomeVideo_get_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Get Banners',
    description: 'This endpoint retrieves banners.',
  })
  @ApiCreatedResponse({
    description: 'Banners were successfully met.',
    type: GetBannerResponse,
  })
  @Post('/banners')
  @HttpCode(200)
  async getBanners(
    @Body(ValidationPipe) getDocumentByLanguageDto: GetDocumentByLanguageDto
  ): Promise<GetBannerResponse> {
    const start = Date.now();
    const response = await this.prismicService.retrieveBanners(getDocumentByLanguageDto);
    const end = Date.now();
    this.statsdService.timing('_prismic_getBanners_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Get Restrictions',
    description: 'This endpoint retrieves restrictions.',
  })
  @ApiCreatedResponse({
    description: 'Restrictions were successfully met.',
    type: GetSecurityQuestionResponse,
  })
  @Post('/restrictions')
  @HttpCode(200)
  async getRestrictions(
    @Body(ValidationPipe) getSecurityQuestionDto: GetSecurityQuestionDto
  ): Promise<GetSecurityQuestionResponse> {
    const start = Date.now();
    const response = await this.prismicService.getSecurityQuestion({ ...getSecurityQuestionDto, id: 2 });
    const end = Date.now();
    await this.statsdService.timing('_prismic_getRestrictions_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Get Health Statements',
    description: 'This endpoint retrieves health statements.',
  })
  @ApiCreatedResponse({
    description: 'Health statements were successfully met.',
    type: GetSecurityQuestionResponse,
  })
  @Post('/health-statements')
  @HttpCode(200)
  async getHealthStatements(
    @Body(ValidationPipe) getSecurityQuestionDto: GetSecurityQuestionDto
  ): Promise<GetSecurityQuestionResponse> {
    const start = Date.now();
    const response = await this.prismicService.getSecurityQuestion({ ...getSecurityQuestionDto, id: 1 });
    const end = Date.now();
    await this.statsdService.timing('_prismic_getHealthStatements_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Get No Check-In',
    description: 'This endpoint retrieves no check-in information.',
  })
  @ApiCreatedResponse({
    description: 'No checkin successfully found.',
    type: getNoCheckInResponse,
  })
  @Post('/no-checkin')
  @HttpCode(200)
  async getNoCheckIn(
    @Body(ValidationPipe) getDocumentByLanguageDto: GetDocumentByLanguageDto
  ): Promise<getNoCheckInResponse> {
    const start = Date.now();
    const response = await this.prismicService.getNoCheckIn(getDocumentByLanguageDto);
    const end = Date.now();
    await this.statsdService.timing('_prismic_getNoCheckIn_post_response_time', end - start);
    return response;
  }

  // @Post('/special-food')
  // @HttpCode(200)
  // async getSpecialFood(
  //   @Body(ValidationPipe) getDocumentByLanguageDto: GetDocumentByLanguageDto
  // ): Promise<GetSpecialFoodResponse> {
  //   await this.statsdService.timing('_prismic_getSpecialFood_post', 4000);
  //   const start = Date.now();
  //   const response = await this.prismicService.getSpecialFood(getDocumentByLanguageDto);
  //   const end = Date.now();
  //   await this.statsdService.timing('_prismic_getSpecialFood_post_response_time', end - start);
  //   return response;
  // }

  @ApiOperation({
    summary: 'Get information about Cuba visa.',
    description: 'This endpoint retrieves information about Cuba visa.',
  })
  @ApiCreatedResponse({
    description: 'Cuba visa successfully found.',
    type: GetCubaVisaMessageResponse,
  })
  @Post('/cuba-visa')
  @HttpCode(200)
  async getCubaVisaMessage(
    @Body(ValidationPipe) getDocumentByLanguageDto: GetDocumentByLanguageDto
  ): Promise<GetCubaVisaMessageResponse> {
    const start = Date.now();
    const response = await this.prismicService.getCubaVisaMessage(getDocumentByLanguageDto);
    const end = Date.now();
    await this.statsdService.timing('_prismic_getCubaVisaMessage_post_response_time', end - start);
    return response;
  }

  // @Post('/airports')
  // @HttpCode(200)
  // async getAirports(
  //   @Body(ValidationPipe) getDocumentByLanguageDto: GetDocumentByLanguageDto
  // ): Promise<GetAirportsResponse> {
  //   await this.statsdService.timing('_prismic_getAirports_post', 4000);
  //   const start = Date.now();
  //   const response = await this.prismicService.getAirports(getDocumentByLanguageDto);
  //   const end = Date.now();
  //   await this.statsdService.timing('_prismic_getAirports_post_response_time', end - start);
  //   return response;
  // }

  @ApiOperation({
    summary: 'Get information about available seats.',
    description: 'This endpoint retrieves information about available seats.',
  })
  @ApiCreatedResponse({
    description: 'Seats were successfully met.',
    type: GetSeatsResponse,
  })
  @Post('/seats')
  @HttpCode(200)
  async getSeats(@Body(ValidationPipe) getPrismicSeatsDto: GetPrismicSeatsDto): Promise<GetSeatsResponse> {
    const start = Date.now();
    const response = await this.prismicService.getSeats(getPrismicSeatsDto);
    const end = Date.now();
    await this.statsdService.timing('_prismic_getSeats_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Get information about available packages.',
    description: 'This endpoint retrieves information about available packages.',
  })
  @ApiCreatedResponse({
    description: 'Packages were successfully met.',
    type: ElementOfDocumentResponse,
  })
  @Post('/packages')
  @HttpCode(200)
  async getPackages(
    @Body(ValidationPipe) getDocumentByLanguageDto: GetDocumentByLanguageDto
  ): Promise<ElementOfDocumentResponse> {
    const start = Date.now();
    const response = await this.prismicService.getPackages(getDocumentByLanguageDto);
    const end = Date.now();
    await this.statsdService.timing('_prismic_getPackages_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Get information about tourist services bundle.',
    description: 'This endpoint retrieves information about tourist services bundle.',
  })
  @ApiCreatedResponse({
    description: 'Service Bundle successfully met.',
    type: GetServicesBundleDto,
  })
  @Post('/service-bundle')
  @HttpCode(200)
  async getTouristInfo(
    @Req() request,
    @Body(ValidationPipe) getTouristInfoDto: GetTouristInfoDto
  ): Promise<GetServicesBundleDto[]> {
    const start = Date.now();
    const response = await this.prismicService.getServiceBundle(
      getTouristInfoDto,
      request.headers.authorization,
      request.user
    );
    const end = Date.now();
    await this.statsdService.timing('_prismic_get_service_bundle_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Retrieve Terms and Conditions text.',
    description: 'This endpoint retrieves the Terms and Conditions text.',
  })
  @ApiCreatedResponse({
    description: 'Terms and conditions successfully met.',
    type: GetTermsAndConditionsTextResponse,
  })
  @Post('/terms-conditions')
  async GetHealthStatements(
    @Body(ValidationPipe)
    getDocumentByLanguageDto: GetDocumentByLanguageDto
  ): Promise<GetTermsAndConditionsTextResponse> {
    const start = Date.now();
    const response = await this.prismicService.GetTermsAndConditionsText(getDocumentByLanguageDto);
    const end = Date.now();
    await this.statsdService.timing('_prismic_get_terms_condition_post_response_time', end - start);
    return response;
  }
}
