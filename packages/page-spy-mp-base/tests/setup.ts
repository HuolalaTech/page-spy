import { mockMP } from './mock/mp';
import { getOriginMPSDK, setMPSDK } from 'page-spy-mp-base/src/helpers/mp-api';

Object.defineProperty(globalThis, 'name', {
  value: '小程序单元测试',
});

// mock compile vars
Object.defineProperty(globalThis, 'PKG_VERSION', {
  value: '1.0.0',
});

setMPSDK(mockMP());

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

const mp = getOriginMPSDK();

export { mp };
