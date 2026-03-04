// TODO: Configurar config
import axios from 'axios';

export const cheffiaApiConfig = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1/cheffia',
  timeout: 10000,
  // httpsAgent: new (require('https').Agent)({
  //   rejectUnauthorized: false // ATENÇÃO: Use apenas em desenvolvimento!
  // })
});

cheffiaApiConfig.interceptors.request.use((config) => {
  // TODO: Adiciona token, headers, etc
  config.headers['Access-Control-Allow-Origin'] = '*';
  config.headers['accept'] = '*/*';
  return config;
});

cheffiaApiConfig.interceptors.response.use(
  (response) => response,
  (error) => {
    // TODO: add Tratamento global de erros
    return Promise.reject(error);
  }
);
