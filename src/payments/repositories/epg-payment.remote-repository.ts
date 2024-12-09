import axios from 'axios';
import { axiosInstance } from 'src/interceptors/axios.interceptor';
import { JsonLogger } from 'src/utils/json-logger';

export class EpgPaymentRemoteRepository {
  private logger = new JsonLogger(EpgPaymentRemoteRepository.name);
  async sendEncryptedPayload(
    encryptedPayload: string,
    integrityCheck: string,
    iv: string,
    merchantId: string
  ): Promise<string> {
    const apiUrl = `${process.env.EPG_URL}/EPGCheckout/rest/online/tokenize`;

    const headers = {
      Apiversion: '3',
      Encryptionmode: 'CBC',
      Iv: iv,
    };

    const params = {
      encrypted: encryptedPayload,
      integrityCheck: integrityCheck,
      merchantId: merchantId,
    };

    try {
      const response = await axiosInstance.post(apiUrl, null, { headers, params });
      const checkoutUrl: string = response.data; // Assuming the response contains the checkout URL
      return checkoutUrl;
    } catch (error) {
      throw new Error('Failed to send encrypted payload to EPG API');
    }
  }
}
