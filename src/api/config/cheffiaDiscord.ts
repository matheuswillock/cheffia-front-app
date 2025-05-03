import axios from 'axios';

export const cheffiaDiscordConfig = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DISCORD_API_URL,
  timeout: 10000,
});

cheffiaDiscordConfig.interceptors.request.use((config) => {
  config.headers['Content-Type'] = 'application/json';
  return config;
});

cheffiaDiscordConfig.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);