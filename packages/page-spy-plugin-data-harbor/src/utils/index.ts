import { isBrowser, ROOM_SESSION_KEY } from '@huolala-tech/page-spy-base';
import type { SpyMessage } from '@huolala-tech/page-spy-types';
import { strFromU8, zlibSync, strToU8 } from 'fflate';

export const getDeviceId = () => {
  if (isBrowser()) {
    const cache = sessionStorage.getItem(ROOM_SESSION_KEY);
    if (cache) {
      return JSON.parse(cache)?.address || '--';
    }
    return window.$pageSpy?.address || window.PageSpy.instance.address || '--';
  }
  return '--';
};

export const formatFilename = (name: string) => {
  return name.toString().replace(/[\s|\\/]/g, '_');
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
