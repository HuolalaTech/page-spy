// PENDING: 这里补泛型
export const promisifyMPApi = (api: (params: any) => any) => {
  return (params: Record<string, any>) => {
    return new Promise((resolve, reject) => {
      api({
        ...params,
        success(res: any) {
          resolve(res);
        },
        fail(err: any) {
          reject(err);
        },
      });
    });
  };
};

export const joinQuery = (args: Record<string, unknown>) => {
  const arr: string[] = [];
  Object.entries(args).forEach(([k, v]) => {
    arr.push(`${k}=${v}`);
  });
  return arr.join('&');
};

let mpSDK: MPSDK;

export const mp = () => {
  if (!mpSDK) {
    throw Error('the mp sdk is not set');
  }
  return mpSDK;
};

export const setMPSDK = (SDK: MPSDK) => {
  mpSDK = SDK;
};

export const getGlobal = () => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  return undefined;
};
