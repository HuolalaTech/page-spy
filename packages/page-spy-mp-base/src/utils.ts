import { AsyncCallback, MPSDK } from './types';

// PENDING: 这里补泛型
export const promisifyMPApi = <R = any>(
  api: (params: any) => any, // we use params:any, because here the params has a obstacle, which is not compatible with AsyncCallback..., try mp.request to see.
) => {
  return (params?: AsyncCallback<R>) => {
    return new Promise<R>((resolve, reject) => {
      api({
        ...params,
        success(res: R) {
          resolve(res);
          params?.success?.(res);
        },
        fail(err: any) {
          reject(err);
          params?.fail?.(err);
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

// Some platform has no global object, we provide this function to manually create your own global object.
let customGlobal: Record<string, any> = {};
export const setCustomGlobal = (global: Record<string, any>) => {
  customGlobal = global;
};

const mockGlobal: Record<string, unknown> = {};

// get the global context, if not found, use the mock global var.
// in tt mp, the global object is not accessible.
export const getGlobal = () => {
  let foundGlobal: Record<string, any> | undefined = undefined;
  if (typeof globalThis !== 'undefined') {
    foundGlobal = globalThis;
  } else if (typeof global === 'object') {
    foundGlobal = global;
  }
  if (foundGlobal === undefined) {
    foundGlobal = mockGlobal;
  }
  if (customGlobal) {
    Object.assign(foundGlobal, customGlobal);
  }
  return foundGlobal;
};
