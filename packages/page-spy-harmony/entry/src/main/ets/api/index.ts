import axios from '@ohos/axios';
import request from './axios';

export const normalRequest = () => {
  return request.get('/?name=blucas', {
    params: {
      string: 'string',
      boolean: true,
      number: 1,
    },
  });
};

export const handle404 = () => {
  return request.post('/404');
};

export const handle500 = () => {
  return request.delete('/500');
};

export const seeErrorResponse = () => {
  return request.post('https://xkxkqaiuwq.abc/a/b/c');
};
