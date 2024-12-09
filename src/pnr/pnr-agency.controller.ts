import { Req, Body, Controller, Patch, Post, ValidationPipe, HttpException, UseInterceptors } from '@nestjs/common';
import { UpdatePassengerInfoDto } from './dto/summary-pnr-request.dto';
import { ModifyPNRDto } from './dto/modify-pnr.dto';
import { ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { GetSummaryResponse } from './responsesDto/get-summary.dto';
import { HttPStatusResponse } from './responsesDto/http-status.dto';
import { SummaryPnrAgencyRequest } from './dto/summary-pnr-agency-request.dto';
import { GetAgencyCreateResponse } from './responsesDto/get-agency-create.dto';
import { PnrAgencyService } from './pnr-agency.service';
import { CreatePnrAgencyWebRequest } from './dto/create-pnr-agency-web-request.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Reservation-Agency')
@Controller('pnr-agency')
export class PnrAgencyController {
  constructor(private readonly PnrService: PnrAgencyService, private statsdService: StatsdService) {}

  @ApiCreatedResponse({
    description: 'Summary have been successfully created.',
    type: GetSummaryResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Create summary Error.',
    type: HttPStatusResponse,
  })
  @ApiOperation({
    summary: 'Retrieves PNR summary',
    description: 'This endpoint retrieves PNR summary from the system.',
  })
  @Post('/summary')
  async summaryPnr(@Body(ValidationPipe) summaryPnrRequest: SummaryPnrAgencyRequest) {
    const start = Date.now();
    const response = await this.PnrService.summaryPnr(summaryPnrRequest, 'Agency');
    const end = Date.now();
    await this.statsdService.timing('_pnr_summaryPnr_post_response_time', end - start);
    return response;
  }

  // @Post('/create')
  // async createPnr(@Body(ValidationPipe) createPnrRequest: CreatePnrRequest) {
  //   await this.statsdService.increment('_pnr_createPnr_post');
  //   const start = await Date.now();
  //   const response = await this.PnrService.createPnr(createPnrRequest);
  //   const end = await Date.now();
  //   await this.statsdService.timing('_pnr_createPnr_post_response_time', end - start);
  //   return response;
  // }

  @ApiCreatedResponse({
    description: 'PNR Agency have been successfully created.',
    type: GetAgencyCreateResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Create PNR Agency Error.',
    type: HttPStatusResponse,
  })
  @ApiOperation({
    summary: 'Create PNR Agency Commit summary',
    description: 'This endpoint retrieves Confirmation Number.',
  })
  @Post('/create')
  async createPnrAgency(@Body(ValidationPipe) CreatePnrAgencyWebRequest: CreatePnrAgencyWebRequest) {
    await this.statsdService.increment('_pnr_createPnr_post');
    const start = await Date.now();
    const response = await this.PnrService.createPnrAgencyWeb(CreatePnrAgencyWebRequest, 'Agency');
    const end = await Date.now();
   await this.statsdService.timing('_pnr_createPnr_post_response_time', end - start);
   return response;
  }

  @ApiOperation({
    summary: 'Updates passengers information',
    description: 'This endpoint updates passengers information in the system.',
  })
  @ApiCreatedResponse({
    description: 'Passenger was successfully modified.',
    type: HttPStatusResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Update passengers Error.',
    type: HttPStatusResponse,
  })
  @Patch('/passengers')
  async updatePassengersInfo(@Req() request, @Body(ValidationPipe) updatePassengerInfoDto: UpdatePassengerInfoDto) {
    const start = await Date.now();
    const response = await this.PnrService.updatePassengersInfo(
      updatePassengerInfoDto,
      request.headers.authorization,
      request.user
    );
    const end = await Date.now();
    await this.statsdService.timing('_pnr_updatePassengersInfo_post_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Modifies PNR',
    description: 'This endpoint modifies PNR in the system.',
  })
  @ApiCreatedResponse({
    description: 'Pnr was successfully modified.',
    type: HttPStatusResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Pnr modify Error.',
    type: HttPStatusResponse,
  })
  @Patch('/')
  async modifyPnr(
    @Req() request,
    @Body(ValidationPipe) addSpecialServicesRequestDto: ModifyPNRDto
  ): Promise<any | HttpException> {
    const start = await Date.now();
    const response = await this.PnrService.modifyPnr(
      addSpecialServicesRequestDto,
      request.headers.authorization,
      request.user
    );
    const end = await Date.now();
    await this.statsdService.timing('_pnr_updateSpecialServices_post_response_time', end - start);
    return response;
  }
}
