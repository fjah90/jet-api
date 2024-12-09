import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { SummaryPnrRequest } from 'src/pnr/dto/summary-pnr-request.dto';

export class EpgPaymentInputDto extends PickType(SummaryPnrRequest, ['passengers'] as const) {
  @IsNumber()
  @ApiProperty()
  amount: number;

  @IsOptional()
  @IsString()
  country: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency: string;

  @ApiProperty()
  @IsString()
  @MaxLength(20)
  merchantTransactionId: string;

  @IsString()
  merchantParams = '';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentSolution: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  operationType: string;

  @IsOptional()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsNumber()
  merchantId: number;

  @IsOptional()
  @IsNumber()
  productId: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Payment Method',
    example: 'VISA',
  })
  paymentMethod: string;

  @IsOptional()
  @IsString()
  paymentMethodType: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'ID Payment Method',
    example: '(ID TPVManager)123ASD',
  })
  authorizationCode: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: 'Name Of Payment Processor',
    example: 'EPG, TPVManager',
  })
  ProcessorName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(6)
  @IsOptional()
  confirmationNumber: string;

  customerCountry: string;

  addressLine1: string;

  postCode: string;

  customerEmail: string;

  telephone: string;

  firstName: string;

  lastName: string;

  city: string;

  toUrlQueryParams(): string {
    const exceptions = ['confirmationNumber'];
    const queryParams = new URLSearchParams();

    Object.entries(this).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && exceptions.indexOf(key) === -1) {
        queryParams.append(key, String(value));
      }
    });

    queryParams.append('statusURL', `${process.env.BASE_URL}/payments/webhook`);
    queryParams.append(
      'successURL',
      `${process.env.BASE_URL}/payments/status?seriesNumber=299&confirmationNumber=${this.merchantTransactionId}&status=success`
    );
    queryParams.append(
      'errorURL',
      `${process.env.BASE_URL}/payments/status?seriesNumber=299&confirmationNumber=${this.merchantTransactionId}&status=failed`
    );
    queryParams.append(
      'cancelURL',
      `${process.env.BASE_URL}/payments/status?seriesNumber=299&confirmationNumber=${this.merchantTransactionId}&status=cancel`
    );
    queryParams.append(
      'awaitingURL',
      `${process.env.BASE_URL}/payments/status?seriesNumber=299&confirmationNumber=${this.merchantTransactionId}&status=pending`
    );

    return queryParams.toString();
  }
}
