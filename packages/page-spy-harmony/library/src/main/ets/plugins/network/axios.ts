import { getRandomId, isString } from '../../utils';
import {
  getFullPath,
  ReqReadyState,
  ResponseType,
} from '../../utils/network/common';
import NetworkProxyBase from '../../utils/network/base';
import socketStore from '../../helpers/socket';
import {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  AxiosStatic,
} from '@ohos/axios';

export default class AxiosProxy extends NetworkProxyBase {
  public requestInterceptor: number | null = null;
  public responseInterceptor: number | null = null;

  constructor(public axios: AxiosStatic | AxiosInstance) {
    super(socketStore);
    this.initProxyHandler();
  }

  public initProxyHandler() {
    this.requestInterceptor = this.axios.interceptors.request.use((config) => {
      const id = getRandomId();
      this.createRequest(id);
      const reqItem = this.getRequest(id);

      reqItem.url = getFullPath(config);
      reqItem.method = config.method;
      reqItem.status = 0;
      reqItem.statusText = 'Pending';
      reqItem.startTime = Date.now();
      reqItem.readyState = ReqReadyState.UNSENT;
      reqItem.requestPayload = isString(config.data)
        ? config.data
        : Object.entries(config.data || {});
      reqItem.requestHeader = Object.entries(config.headers || {});
      this.sendRequestItem(id, reqItem);

      config['page-spy-id'] = id;
      return config;
    });

    this.responseInterceptor = this.axios.interceptors.response.use(
      (res) => {
        this.handleResponse(res);
        return res;
      },
      (err: AxiosError) => {
        const { headers, data } = err.response;
        if (headers && data) {
          this.handleResponse(err.response);
        } else {
          const id = err.config['page-spy-id'];
          const reqItem = this.getRequest(id);
          reqItem.status = err.code;
          reqItem.statusText = err.name;
          reqItem.endTime = Date.now();
          reqItem.costTime =
            reqItem.endTime - (reqItem.startTime || reqItem.endTime);
          reqItem.readyState = ReqReadyState.DONE;
          this.sendRequestItem(id, reqItem);
        }
      },
    );
  }

  handleResponse(res: AxiosResponse) {
    const id = res.config['page-spy-id'];
    const reqItem = this.getRequest(id);
    reqItem.status = res.status;
    reqItem.statusText = res.statusText;
    reqItem.endTime = Date.now();
    reqItem.costTime = reqItem.endTime - (reqItem.startTime || reqItem.endTime);
    reqItem.readyState = ReqReadyState.DONE;
    reqItem.responseHeader = Object.entries((res.headers as Object) || {});

    switch (res.config.responseType) {
      case 'object':
        reqItem.response = res.data;
        reqItem.responseType = ResponseType.OBJECT;
        break;
      case 'array_buffer':
        reqItem.response = '[object ArrayBuffer]';
        reqItem.responseType = ResponseType.ARRAY_BUFFER;
        break;
      default:
        try {
          reqItem.response = JSON.parse(res.data);
          reqItem.responseType = ResponseType.OBJECT;
        } catch {
          reqItem.response = res.data;
          reqItem.responseType = ResponseType.STRING;
        }
        break;
    }
    this.sendRequestItem(id, reqItem);
  }

  public reset() {
    if (this.requestInterceptor !== null) {
      this.axios.interceptors.request.eject(this.requestInterceptor);
      this.requestInterceptor = null;
    }
    if (this.responseInterceptor !== null) {
      this.axios.interceptors.response.eject(this.responseInterceptor);
      this.responseInterceptor = null;
    }
  }
}
