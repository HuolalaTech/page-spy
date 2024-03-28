import { isBrowser } from 'base/src';

export const getDeviceId = () => {
  if (isBrowser()) {
    return (
      window.$pageSpy?.address ||
      window.PageSpy.instance.address ||
      JSON.parse(sessionStorage.getItem('page-spy-room') || '')?.address
    );
  }
  return '--';
};

export const formatFilename = (name: string) => {
  return name.toString().replace(/[\s|\\/]/g, '_');
};
