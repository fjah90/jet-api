import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { StatsdService } from 'src/statsd/statsd.service';
import { Configuration } from '../statsd/interface/configuration.interface';
// import { writeLog } from 'log-request';

export const axiosInstance = axios.create();

let startTime: number | null = null;
let typeOfTiming;
axiosInstance.interceptors.request.use(
  (config) => {
    // Aquí puedes verificar si la URL es la que deseas
    if (config.url.includes(process.env.PRISMIC_REPO_NAME)) typeOfTiming = 'prismic';
    if (config.url.includes(process.env.RADIXX_URL)) typeOfTiming = 'radixx';
    if (config.url.includes(process.env.EPG_URL)) typeOfTiming = 'epg';
    // Guardar el tiempo de inicio
    startTime = Date.now();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  async (response) => {
    // Aquí puedes verificar si la URL es la que deseas

    // Calcular el tiempo transcurrido y llamar a la propiedad timing de StatsdService
    const endTime = Date.now();
    const elapsedTime = endTime - startTime;

    // if (typeOfTiming == 'radixx') {
    //   writeLog(response.config.data, `${Date.now()}-RQ`);
    //   writeLog(response.data, `${Date.now()}-RS`);
    // }
    const statsdService = new StatsdService(new ConfigService<Configuration>());

    await statsdService?.timing(`_${typeOfTiming}_response_time`, elapsedTime);

    // Reiniciar startTime para la próxima solicitud
    startTime = null;

    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);
