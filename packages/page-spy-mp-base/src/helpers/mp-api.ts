// Wrap the mp api to smooth the platform differences, for internal usage only.
// This api can be modified by mp sdk implementor.
// This api should be passed through PageSpy instance to avoid esm multi-pack.

import { MPSDK } from '../types';

let mpSDK: any;

// the origin mp sdk, used for hacking
let originMPSDK: any;

if (typeof Proxy !== 'undefined') {
  mpSDK = new Proxy(
    {},
    {
      get(target, p: string) {
        if (platformAPI[p]) {
          return platformAPI[p];
        }
        if (originMPSDK[p]) {
          return originMPSDK[p];
        } else {
          console.error('The mp sdk does not support the api:', p);
        }
      },
    },
  );
}

// for API compatibility
// this api can be modified by mp sdk implementor, to smoothy the platform differences.
export const platformAPI: Record<string, any> = {};
export const getMPSDK = () => {
  if (!mpSDK) {
    throw Error('the mp sdk is not set');
  }
  return mpSDK as MPSDK;
};

export const getOriginMPSDK = () => originMPSDK as MPSDK;

export const setMPSDK = (SDK: MPSDK) => {
  originMPSDK = SDK;
  if (typeof Proxy === 'undefined') {
    mpSDK = {
      ...SDK,
      ...platformAPI,
    };
  }
};
