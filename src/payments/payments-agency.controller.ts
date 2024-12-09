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
import { ApiTags, ApiCreatedResponse, ApiExcludeEndpoint, ApiOperation } from '@nestjs/swagger';
import { SentryInterceptor } from 'src/interceptors/sentry.interceptor';
import { StatsdService } from 'src/statsd/statsd.service';
import { GenerateCheckoutResponse } from './responsesDto/generate-checkout.dto';
import { JsonLogger } from 'src/utils/json-logger';
import { EpgPaymentInputAgencyDto } from './dto/epg-payment-input-agency.dto';
import { PaymentsAgencyService } from './payments-agency.service';
import { PaymentWithAgencyCreditDto } from './dto/credit-payment-input-agency.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('payments-agency')
@Controller('payments-agency')
export class PaymentsAgencyController {
  constructor(
    private readonly paymentsService: PaymentsAgencyService,
    private statsdService: StatsdService,
    private jsonLogger: JsonLogger
  ) {}

  /*  @ApiOperation({
    summary: 'Generate Checkout URL',
    description: 'Create a checkout URL for payments.',
  })
  @ApiCreatedResponse({
    description: 'Checkout URL have been successfully created.',
    type: [GenerateCheckoutResponse],
  })
  @Post('/generate-checkout')
  async generateCheckoutUrl(@Req() request, @Body(ValidationPipe) paymentInput: EpgPaymentInputAgencyDto) {
    const start = Date.now();
    const response = await this.paymentsService.generateCheckoutUrl(paymentInput, 'Agency');
    const end = Date.now();
    await this.statsdService.timing('_generate_checkout_response_time', end - start);
    return response;
  } */
  @ApiOperation({
    summary: 'Save Payment',
    description: 'Save a payment for a Reservation',
  })
  @Post('/save-payment')
  async savePayment(@Req() request, @Body(ValidationPipe) paymentInput: EpgPaymentInputAgencyDto) {
    const start = Date.now();
    const response = await this.paymentsService.savePayment(
      paymentInput,
      request.headers.authorization,
      paymentInput.iata,
      'Agency'
    );
    const end = Date.now();
    await this.statsdService.timing('_save_payment_response_time', end - start);
    return response;
  }

  @Post('/paywithcreditagency')
  async paywithcreditagency(@Req() request, @Body(ValidationPipe) paymentInput: PaymentWithAgencyCreditDto) {
    const start = Date.now();
    const response = await this.paymentsService.paywithcreditagency(paymentInput, 'Agency');
    const end = Date.now();
    await this.statsdService.timing('_pay_with_credit_agency_response_time', end - start);
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
