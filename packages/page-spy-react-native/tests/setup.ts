import type { ErrorHandlerCallback } from 'react-native';
import '@testing-library/jest-native/extend-expect';

Object.defineProperty(globalThis, 'name', {
  value: 'React Native 单元测试',
});

Object.defineProperty(globalThis, 'ErrorUtils', {
  value: function () {
    let handler: ErrorHandlerCallback | null = null;
    return {
      triggerError(err: Error | string) {
        handler?.(err);
      },
      setGlobalHandler(cb: ErrorHandlerCallback) {
        handler = cb;
      },
      getGlobalHandler() {
        return handler;
      },
    };
  },
});
