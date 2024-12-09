import axios from 'axios';
import { axiosInstance } from 'src/interceptors/axios.interceptor';
import { JsonLogger } from 'src/utils/json-logger';

export class AxiosClient {
  private logger = new JsonLogger();

  static async Post(args, url, headers, actionType) {
    // this.logger.log(`[LOG INFO BEFORE ${actionType}] ` + args);
    const xmlResponse = await axiosInstance.post(url, args, headers);
    return xmlResponse;
  }
  static async DirectPost(Url, Data, ActionSOAP) {
    const response = await axios({
      method: 'post',
      url: Url,
      data: Data,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: ActionSOAP,
      },
    });
    return response;
  }
}
