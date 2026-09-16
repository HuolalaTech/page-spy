import { RequestItem } from 'page-spy-base/src';

describe('RequestItem', () => {
  it('initializes a request with the expected defaults', () => {
    const item = new RequestItem('request-id');

    expect(item).toEqual({
      id: 'request-id',
      method: '',
      url: '',
      requestType: 'xhr',
      requestHeader: null,
      status: 0,
      statusText: '',
      readyState: 0,
      response: '__PLACEHOLDER_RESPONSE_DEFINED_BY_PAGE_SPY__',
      responseReason: null,
      responseType: '',
      responseHeader: null,
      startTime: 0,
      endTime: 0,
      costTime: 0,
      postData: null,
      requestPayload: null,
      withCredentials: false,
      lastEventId: '',
    });
  });
});
