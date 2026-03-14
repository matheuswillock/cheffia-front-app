// TODO: Configurar config
import axios from 'axios';

const LEGACY_LOCAL_BACKEND_URL = 'http://localhost:8080/api/v1/cheffia';
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const apiBaseUrl =
  configuredApiUrl && configuredApiUrl !== LEGACY_LOCAL_BACKEND_URL
    ? configuredApiUrl
    : '/api/v1/cheffia';

export const cheffiaApiConfig = axios.create({
  baseURL: apiBaseUrl,
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
