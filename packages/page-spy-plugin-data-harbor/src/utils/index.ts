import {
  isBrowser,
  isNumber,
  ROOM_SESSION_KEY,
} from '@huolala-tech/page-spy-base';
import type { SpyMessage } from '@huolala-tech/page-spy-types';
import { strFromU8, zlibSync, strToU8 } from 'fflate';

export const getDeviceId = () => {
  if (isBrowser()) {
    const cache = sessionStorage.getItem(ROOM_SESSION_KEY);
    if (cache) {
      return JSON.parse(cache)?.address || '--';
    }
    return (
      window.$pageSpy?.address || window.PageSpy?.instance?.address || '--'
    );
  }
  return '--';
};

export const formatFilename = (name: string) => {
  return name.toString().replace(/[^\w]/g, '_');
};

export const minifyData = (d: any) => {
  return strFromU8(zlibSync(strToU8(JSON.stringify(d)), { level: 9 }), true);
};

export const makeData = <T extends SpyMessage.DataType>(type: T, data: any) => {
  return {
    type,
    timestamp: Date.now(),
    data: minifyData(data),
  };
};

export const jsonToFile = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json',
  });
  const file = new File([blob], `${formatFilename(filename)}.json`, {
    type: 'application/json',
  });
  return file;
};

// Valid duration of each period is 1 minute ~ 30 minutes.
export const isValidPeriod = (period: unknown): period is number => {
  return isNumber(period) && period >= 60 * 1000 && period <= 30 * 60 * 1000;
};

export const isValidMaximum = (maximum: unknown): maximum is number => {
  return isNumber(maximum) && maximum >= 0;
};
