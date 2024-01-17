import { initStorageMock, mockWXStorage } from './mock/storage';
import { MockMP } from './mock/mp';
import { getMPSDK, setMPSDK } from 'mp-base/src/utils';

Object.defineProperty(globalThis, 'name', {
  value: '小程序单元测试',
});

// mock compile vars
Object.defineProperty(globalThis, 'PKG_VERSION', {
  value: '1.0.0',
});

setMPSDK(new MockMP());

initStorageMock();

Object.defineProperty(globalThis, 'getCurrentPages', {
  value: function () {
    return [
      {
        route: 'page/index/index',
        options: {
          aaa: 'bbb',
        },
      },
    ];
  },
});

const mp = getMPSDK();

export { mp };
