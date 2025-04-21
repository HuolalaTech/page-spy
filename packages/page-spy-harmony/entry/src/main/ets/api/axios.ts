import axios, { AxiosError, InternalAxiosRequestConfig } from '@ohos/axios';

declare module '@ohos/axios' {
  export interface InternalAxiosRequestConfig {
    checkLogin?: boolean;
    isLogin?: boolean;
  }
}

class NotLoginError extends AxiosError {
  constructor() {
    super('请登陆后重试');
    this.name = 'NotLoginError';
    this.status = -100;
  }
}

const request = axios.create({
  baseURL: 'https://request.blucas.me',
  timeout: 1000 * 60,
});

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.checkLogin && !config.isLogin) {
    throw new NotLoginError();
  }
  return config;
});

request.interceptors.response.use(
  (res) => {
    return res;
  },
  (e: AxiosError) => {
    throw e;
  },
);

export default request;
