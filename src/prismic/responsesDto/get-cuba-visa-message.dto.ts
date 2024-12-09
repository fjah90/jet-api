import { PartialType } from '@nestjs/swagger';
import { getNoCheckInResponse } from './get-no-checkin.dto';

export class GetCubaVisaMessageResponse extends PartialType(getNoCheckInResponse) {}
