import { Injectable } from '@nestjs/common';
import { GetHealthResponse } from '../responsesDto/get-health-response';
import { PrismicService } from 'src/prismic/services';
import { AuthService } from 'src/auth/auth.service';
import { Languages } from 'src/prismic/entities/enum';
import { EpgPaymentInputDto } from 'src/payments/dto/epg-payment-input.dto';
import { plainToInstance } from 'class-transformer';
import { EncryptionService } from 'src/payments/encryption.service';
import { EpgPaymentRemoteRepository } from 'src/payments/repositories/epg-payment.remote-repository';
import { StatsdService } from 'src/statsd/statsd.service';
import { CronJob } from 'cron';

@Injectable()
export class HealthService {
  private job: CronJob;
  constructor(
    private readonly prismicService: PrismicService,
    private readonly authService: AuthService,
    private readonly encryptionService: EncryptionService,
    private readonly epgPaymentRemoteRepository: EpgPaymentRemoteRepository,
    private readonly statsdService: StatsdService
  ) {}
  onModuleInit() {
    this.job = new CronJob(
      '*/20 * * * * *',
      () => {
        this.getPrismicHealth();
        this.getRadixxHealth();
        this.getEPGHealth();
      },
      null,
      true,
      'America/Los_Angeles'
    );

    this.job.start();
  }
  async getPrismicHealth(): Promise<GetHealthResponse> {
    let status: boolean;

    try {
      const lang = Languages['ES-ES'];
      this.prismicService.retrieveBanners({ lang });
      status = true;
    } catch {
      status = false;
    }
    this.statsdService.gauge('_get_prismic_health', status ? 1 : 0);
    return {
      status,
    };
  }

  async getRadixxHealth(): Promise<GetHealthResponse> {
    let status: boolean;
    try {
      await this.authService.validateSecurityToken();
      status = true;
    } catch {
      status = false;
    }
    this.statsdService.gauge('_get_radixx_health', status ? 1 : 0);
    return {
      status,
    };
  }

  async getEPGHealth(): Promise<GetHealthResponse> {
    let status: boolean;

    try {
      await this.sendEPGPayment();
      status = true;
    } catch {
      status = false;
    }
    this.statsdService.gauge('_get_epg_health', status ? 1 : 0);
    return {
      status,
    };
  }

  async sendEPGPayment() {
    const paymentInput = {
      merchantParams: '',
      merchantId: Number(process.env.MERCHANT_ID),
      productId: Number(process.env.PRODUCT_ID),
      merchantTransactionId: '',
      amount: 830.62,
      currency: 'EUR',
      confirmationNumber: null,
      operationType: process.env.OPERATION_TYPE,
      paymentSolution: process.env.PAYMENT_SOLUTION,
      country: 'ES',
      customerId: Date.now().toString(),
    };

    const epgPaymentInputDto = plainToInstance(EpgPaymentInputDto, paymentInput) as EpgPaymentInputDto;

    const payload = epgPaymentInputDto.toUrlQueryParams();
    const { encryptedPayload, iv, integrityCheck } = this.encryptionService.encryptPayload(
      payload,
      process.env.EPG_MERCHANT_PASSWORD
    );

    await this.epgPaymentRemoteRepository.sendEncryptedPayload(
      encryptedPayload,
      integrityCheck,
      iv,
      paymentInput.merchantId.toString()
    );
  }
}
