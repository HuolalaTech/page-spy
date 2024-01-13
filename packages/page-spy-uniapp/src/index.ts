import { getGlobal } from 'mp-base/src/utils';
import PageSpy from 'mp-base/src';
import Device from 'mp-base/src/device';
// reassign the global.mp to uni

Object.defineProperty(getGlobal(), 'mp', {
  value: uni,
  configurable: false,
  writable: false,
});

Device.info.framework = 'UniApp';
Device.info.browserName = 'MPWeChat';

export default PageSpy;
