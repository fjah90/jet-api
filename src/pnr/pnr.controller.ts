import { Req, Body, Controller, Patch, Post, ValidationPipe, HttpException, UseInterceptors } from '@nestjs/common';
import { PnrService } from './pnr.service';
import { SummaryPnrRequest, UpdatePassengerInfoDto } from './dto/summary-pnr-request.dto';
import { CreatePnrRequest } from './dto/create-pnr-request.dto';
import { CreatePnrWebRequest } from './dto/create-pnr-web-request.dto';
import { ModifyPNRDto } from './dto/modify-pnr.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { GetSummaryResponse } from './responsesDto/get-summary.dto';
import { GetSummaryCreateResponse } from './responsesDto/get-summary-create.dto';
import { GetCreateResponse } from './responsesDto/get-create.dto';
import { HttPStatusResponse } from './responsesDto/http-status.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Reservation')
@ApiBearerAuth()
@Controller('pnr')
export class PnrController {
  constructor(private readonly PnrService: PnrService, private statsdService: StatsdService) {}

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
  async summaryPnr(@Req() request, @Body(ValidationPipe) summaryPnrRequest: SummaryPnrRequest) {
    const start = Date.now();
    const response = await this.PnrService.summaryPnr(summaryPnrRequest, request.headers.authorization, request.user);
    const end = Date.now();
    await this.statsdService.timing('_pnr_summaryPnr_post_response_time', end - start);
    return response;
  }

  @ApiCreatedResponse({
    description: 'PNR have been successfully created.',
    type: GetCreateResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Create PNR Error.',
    type: HttPStatusResponse,
  })
  @ApiOperation({
    summary: 'Create PNR Commit summary',
    description: 'This endpoint retrieves Confirmation Number.',
  })
  @Post('/create')
  async createPnr(@Req() request, @Body(ValidationPipe) CreatePnrWebRequest: CreatePnrWebRequest) {
    await this.statsdService.increment('_pnr_createPnr_post');
    const start = await Date.now();
    const response = await this.PnrService.createPnrWeb(CreatePnrWebRequest, request.headers.authorization, request.user);
    const end = await Date.now();
   await this.statsdService.timing('_pnr_createPnr_post_response_time', end - start);
   return response;
  }

  @ApiCreatedResponse({
    description: 'Summary Create have been successfully created.',
    type: GetSummaryCreateResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Summary Create PNR Error.',
    type: HttPStatusResponse,
  })
  @ApiOperation({
    summary: 'Summary Create Commit summary',
    description: 'This endpoint retrieves PNR summary and Confirmation Number.',
  })
  @Post('/summary-create')
  async summaryCreatePnr(@Req() request, @Body(ValidationPipe) summaryPnrRequest: SummaryPnrRequest) {
    const start = Date.now();
    const response = await this.PnrService.summaryCreatePnr(summaryPnrRequest, request.headers.authorization, request.user);
    const end = Date.now();
    await this.statsdService.timing('_pnr_summaryPnr_post_response_time', end - start);
    return response;
  }

  @ApiCreatedResponse({
    description: 'Summary info have been obtained successfully.',
    type: GetSummaryResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Create summary info Error.',
    type: HttPStatusResponse,
  })
  @ApiOperation({
    summary: 'Retrieves PNR summary Info',
    description: 'This endpoint retrieves PNR summary info from the system.',
  })
  @Post('/summary-show')
  async summaryPnrShow(@Req() request, @Body(ValidationPipe) summaryPnrRequest: SummaryPnrRequest) {
    const start = Date.now();
    const response = await this.PnrService.summaryPnrShow(summaryPnrRequest, request.headers.authorization, request.user);
    const end = Date.now();
    await this.statsdService.timing('_pnr_summaryPnr_post_response_time', end - start);
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
