import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Query,
  RawBodyRequest,
  Req,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { CheckoutStatusQueryDto } from './dto/checkout-status-query.dto';
import { EpgPaymentInputDto } from './dto/epg-payment-input.dto';
import { PaymentsService } from './payments.service';
import { ApiTags, ApiBearerAuth, ApiCreatedResponse, ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { StatsdService } from 'src/statsd/statsd.service';
import { GenerateCheckoutResponse } from './responsesDto/generate-checkout.dto';
import { JsonLogger } from 'src/utils/json-logger';

@UseInterceptors(SentryInterceptor)
@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private statsdService: StatsdService,
    private jsonLogger: JsonLogger
  ) {}

  @ApiOperation({
    summary: 'Generate Checkout URL',
    description: 'Create a checkout URL for payments.',
  })
  @ApiCreatedResponse({
    description: 'Checkout URL have been successfully created.',
    type: [GenerateCheckoutResponse],
  })
  @Post('/generate-checkout')
  async generateCheckoutUrl(@Req() request, @Body(ValidationPipe) paymentInput: EpgPaymentInputDto) {
    const start = Date.now();
    const response = await this.paymentsService.generateCheckoutUrl(
      paymentInput,
      request.headers.authorization,
      request.user
    );
    const end = Date.now();
    await this.statsdService.timing('_generate_checkout_response_time', end - start);
    return response;
  }

  @ApiOperation({
    summary: 'Save Payment',
    description: 'Save a payment for a Reservation',
  })
  @Post('/save-payment')
  async savePayment(@Req() request, @Body(ValidationPipe) paymentInput: EpgPaymentInputDto) {
    const start = Date.now();
    const response = await this.paymentsService.savePayment(paymentInput, request.headers.authorization, request.user);
    const end = Date.now();
    await this.statsdService.timing('_save_payment_response_time', end - start);
    return response;
  }

  @ApiExcludeEndpoint()
  @Get('/status')
  async setStatus(@Query() query: CheckoutStatusQueryDto, @Ip() ip: string) {
    const userIp = ip;
    this.jsonLogger.log(`ip: ${userIp}`);

    // const availablesIPs = String(process.env.ALLOWED_PAYMENT_IP).split(',');
    // if (availablesIPs.every((ip: string) => ip != userIp))
    //   throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const start = Date.now();
    const response = this.paymentsService.setStatus(query);
    const end = Date.now();
    await this.statsdService.timing('_set_status_response_time', end - start);
    return response;
  }

  // @Post('/test')
  // async test(@Req() req: any) {
  //   const start = Date.now();
  //   const response = await this.paymentsService.testSendEmail(req);
  //   const end = Date.now();
  //   return response;
  // }

  @ApiExcludeEndpoint()
  @Post('/webhook')
  async webhook(@Req() req: RawBodyRequest<Request>, @Ip() ip: string) {
    const userIp = ip;
    this.jsonLogger.log(`ip: ${userIp}`);

    // const availablesIPs = String(process.env.ALLOWED_PAYMENT_IP).split(',');
    // if (availablesIPs.every((ip: string) => ip != userIp))
    //   throw new HttpException('Method Not Allowed', HttpStatus.METHOD_NOT_ALLOWED);
    const start = Date.now();
    const response = await this.paymentsService.capturePaymentStatus(req);
    const end = Date.now();
    await this.statsdService.timing('_payment_webhook_response_time', end - start);
    return response;
  }
}
