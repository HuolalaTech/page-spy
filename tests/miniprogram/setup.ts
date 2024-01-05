import { mockRequest } from './mock/request';
import { initStorageMock, mockWXStorage } from './mock/storage';
import { MockWX } from './mock/wx';

Object.defineProperty(globalThis, 'name', {
  value: '小程序单元测试',
});

// mock compile vars
Object.defineProperty(globalThis, 'PKG_VERSION', {
  value: '1.0.0',
});

export {};

Object.defineProperty(globalThis, 'wx', {
  value: new MockWX(),
});

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
