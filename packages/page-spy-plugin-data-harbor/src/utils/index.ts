import {
  isBrowser,
  isNumber,
  psLog,
} from '@huolala-tech/page-spy-base/dist/utils';
import { ROOM_SESSION_KEY } from '@huolala-tech/page-spy-base/dist/constants';

import { strFromU8, zlibSync, strToU8 } from 'fflate';
import { DataType } from '../harbor/base';

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

export const makeData = <T extends DataType>(type: T, data: any) => {
  if (sessionStorage.getItem('harbor-debug')) {
    psLog.unproxy.debug('harbor-debug', data);
  }
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

export const isValidMaximum = (maximum: unknown): maximum is number => {
  return isNumber(maximum) && maximum >= 0;
};

function fillTimeText(v: number) {
  if (v >= 10) return v.toString();
  return `0${v}`;
}

export function formatTimeDuration(millsDiff: number) {
  const seconds = parseInt(String(millsDiff / 1000), 10);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - 3600 * h) / 60);
  const s = Math.floor(seconds - 3600 * h - 60 * m);
  return `${fillTimeText(h)}:${fillTimeText(m)}:${fillTimeText(s)}`;
}
