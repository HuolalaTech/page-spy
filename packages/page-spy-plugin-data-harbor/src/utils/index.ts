import { isBrowser, ROOM_SESSION_KEY } from '@huolala-tech/page-spy-base';

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
