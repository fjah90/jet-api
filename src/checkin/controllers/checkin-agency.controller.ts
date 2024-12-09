import { Body, Controller, HttpCode, HttpException, Post, Req, UseInterceptors, ValidationPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetBoardingPassResponse } from '../responsesDto';
import { StatsdService } from 'src/statsd/statsd.service';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { HttPStatusResponse } from 'src/pnr/responsesDto/http-status.dto';
import { CreateCheckinAgencyDto } from '../dto/create-checkin-agency.dto';
import { CheckinAgencyService } from '../services/checkin-agency.service';
import { GetBoardingPassAgencyDto } from '../dto/get-boarding-pass-agency.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Checkin-Agency')
@ApiBearerAuth()
@Controller('checkin-agency')
export class CheckinAgencyController {
  constructor(private readonly checkinService: CheckinAgencyService, private statsdService: StatsdService) {}

  @ApiOperation({
    summary: 'Creates a checkin',
    description: 'This endpoint creates a checkin in the system.',
  })
  @Post('/')
  @ApiCreatedResponse({
    description: 'Checkin successfully created.',
    type: HttPStatusResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Checkin Error.',
    type: HttPStatusResponse,
  })
  @HttpCode(200)
  async createCheckin(
    @Req() request,
    @Body(ValidationPipe) createCheckinDto: CreateCheckinAgencyDto
  ): Promise<HttpException> {
    const start = Date.now();
    const response = await this.checkinService.createCheckin(createCheckinDto);
    const end = Date.now();
    await this.statsdService.timing('_create_checkin_response_time', end - start);
    return response;
  }

  // @UsePipes(new ValidationPipe({ transform: true }))
  // @Post('/post-send-email')
  // @HttpCode(200)
  // async postSendEmail(
  //   @Req() request,
  //   @Body(ValidationPipe) postSendEmailDto: PostSendEmailDto
  // ): Promise<PostSendEmailResponse> {
  //   // await this.statsdService.increment('checkin_postSendEmail_post');
  //   // const start = await Date.now();
  //   const response = await this.checkinService.postSendEmail(postSendEmailDto, request.headers.authorization);
  //   // const end = await Date.now();
  //   // await this.statsdService.timing('checkin_postSendEmail_post_response_time', end - start);
  //   return response;
  // }

  @ApiOperation({
    summary: 'Retrieves boarding passes',
    description: 'This endpoint retrieves boarding passes from the system.',
  })
  @Post('/boarding-pass')
  @ApiCreatedResponse({
    description: 'BoardingPasses had been successfully created.',
    type: [GetBoardingPassResponse],
  })
  @ApiInternalServerErrorResponse({
    description: 'BoardingPass Error.',
    type: HttPStatusResponse,
  })
  @HttpCode(200)
  async getBoardingPass(
    @Req() request,
    @Body(ValidationPipe) getBoardingPassDto: GetBoardingPassAgencyDto
  ): Promise<GetBoardingPassResponse[] | HttpException> {
    const start = Date.now();
    const response = await this.checkinService.getBoardinPass(getBoardingPassDto, 'Agency');
    const end = Date.now();
    await this.statsdService.timing('_get_boarding_pass_response_time', end - start);
    return response;
  }
}
