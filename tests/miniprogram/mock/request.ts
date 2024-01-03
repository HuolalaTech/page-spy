export const mockRequest = (
  params: {
    url: string;
    method?: string;
    header?: Record<string, string>;
    timeout?: number;
    dataType?: 'json';
    responseType?: 'text' | 'arraybuffer';
  } & AsyncCallback,
) => {
  switch (params.url) {
    case '/plain-text':
      params.success?.({
        statusCode: 200,
        header: {
          'content-type': 'application/json',
        },
        data: 'Hello PageSpy',
      });
      break;
    case '/json':
      params.success?.({
        statusCode: 200,
        header: {
          'content-type': 'application/json',
        },
        data: { text: 'Hello PageSpy' },
      });
      break;
    case '/array-buffer':
      params.success?.({
        statusCode: 200,
        header: {
          'content-type': 'application/json',
        },
        data: new Uint8Array([1, 2, 3, 4]),
      });
      break;
    default:
      params.success?.({
        statusCode: 200,
        header: {
          'content-type': 'text/plain',
        },
        data: 'Hello PageSpy',
      });
  }
};
