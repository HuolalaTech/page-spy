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

export const fakeAuth = () => {
  return request.get('/detail', {
    checkLogin: true,
  } as any);
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
