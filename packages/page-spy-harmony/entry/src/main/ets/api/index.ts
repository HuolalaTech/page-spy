import axios from '@ohos/axios';
import request from './axios';

export const seeRequestInfo = () => {
  return request.get('/', {
    data: {
      bar: 'bar',
    },
    params: {
      string: 'string',
      boolean: true,
      number: 1,
      list: [1, 2, 3],
      obj: {
        name: 'blucas',
        age: 28,
        country: 'China',
        likes: [1, true, 2, 'work'],
      },
    },
  });
};

export const handle404 = () => {
  return request.post('/status/404');
};

export const handle500 = () => {
  return request.delete('/status/500');
};

export const seeErrorResponse = () => {
  return request.post('https://xkxkqaiuwq.abc/a/b/c');
};
