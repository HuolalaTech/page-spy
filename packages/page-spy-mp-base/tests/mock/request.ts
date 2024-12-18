import { MPNetworkAPI } from 'page-spy-mp-base/src/types';

export const mockRequest = (params: Parameters<MPNetworkAPI['request']>[0]) => {
  let res: any = {};
  switch (params.url) {
    case '/plain-text':
      res = {
        statusCode: 200,
        header: {
          'content-type': 'application/json',
        },
        data: 'Hello PageSpy',
      };
      params.success?.(res);
      params.complete?.(res);
      break;
    case '/json':
      res = {
        statusCode: 200,
        header: {
          'content-type': 'application/json',
        },
        data: { text: 'Hello PageSpy' },
      };
      params.success?.(res);
      params.complete?.(res);
      break;
    case '/array-buffer':
      res = {
        statusCode: 200,
        header: {
          'content-type': 'application/octet-stream',
        },
        data: new ArrayBuffer(10),
      };
      params.success?.(res);
      params.complete?.(res);
      break;
    case '/fail':
      res = {
        statusCode: 400,
        header: {
          'content-type': 'text/plain',
        },
        data: 'Hello PageSpy',
      };
      params.fail?.(res);
      params.complete?.(res);
      break;
    default:
      if (params.url.includes('/api/v1/room/create')) {
        res = {
          statusCode: 200,
          header: {
            'content-type': 'application/json',
          },
          data: {
            code: 'ok',
            message: 'mock response',
            success: true,
            data: {
              name: 'xxxx-name',
              address: 'xxxx-address',
              group: 'xxxx-group',
              password: 'xxxx-password',
              tags: {},
            },
          },
        };
        params.success?.(res);
        params.complete?.(res);
        return;
      }
      res = {
        statusCode: 200,
        header: {
          'content-type': 'text/plain',
        },
        data: 'Hello PageSpy',
      };
      params.success?.(res);
      params.complete?.(res);
  }
};

mockRequest.isOrigin = true;
