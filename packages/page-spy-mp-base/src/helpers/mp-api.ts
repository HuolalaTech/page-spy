// Wrap the mp api to smooth the platform differences, for internal usage only.
// This api can be modified by mp sdk implementor.
// This api should be passed through PageSpy instance to avoid esm multi-pack.

import { MPSDK } from '../types';

let mpSDK: MPSDK;

// the origin mp sdk, used for hacking
let originMPSDK: MPSDK;

// for API compatibility
// this api can be modified by mp sdk implementor, to smoothy the platform differences.
export const platformAPI = {} as MPSDK;
export const getMPSDK = () => {
  if (!mpSDK) {
    throw Error('the mp sdk is not set');
  }
  return mpSDK;
};

export const getOriginMPSDK = () => originMPSDK;

export const setMPSDK = (SDK: MPSDK) => {
  originMPSDK = SDK;
  mpSDK = {
    ...SDK,
    ...platformAPI,
  };
};
