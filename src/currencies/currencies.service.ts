import { Injectable } from '@nestjs/common';
import { ConvertCurrenciesDto } from './dto/convert-currencies.dto';
import { CurrenciesRemoteRepository } from './currencies.remote-repository';
import { AuthService } from 'src/auth/auth.service';
import { GetCurrenciesResponse } from './responsesDto/get-currencies.dto';

@Injectable()
export class CurrenciesService {
  constructor(private currenciesRemoteRepository: CurrenciesRemoteRepository, private authService: AuthService) {}

  async convertCurrencies(params: ConvertCurrenciesDto, firebaseToken: string) {
    const token = await this.authService.getRadixxTokenFromCache(firebaseToken);
    return this.currenciesRemoteRepository.convertCurrencies({ ...params, token });
  }

  async getAvailableCurrencies(): Promise<GetCurrenciesResponse[]> {
    return this.currenciesRemoteRepository.availableCurrencies();
  }
}
