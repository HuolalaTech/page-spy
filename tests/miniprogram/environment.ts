import NodeEnvironment from 'jest-environment-node';
import type { Config, Circus } from '@jest/types';
import type { EnvironmentContext } from '@jest/environment';
export default class MPWeixinEnvironment extends NodeEnvironment {
  constructor(config: Config.ProjectConfig, context: EnvironmentContext) {
    super(config);
  }

  async setup() {
    this.global.wx = {
      setStorage() {},
      setStorageSync() {},
      batchSetStorage() {},
      batchSetStorageSync() {},
      getStorage() {},
      getStorageSync() {},
      batchGetStorage() {},
      batchGetStorageSync() {},
      removeStorage() {},
      removeStorageSync() {},
      clearStorage() {},
      clearStorageSync() {},

      request() {},
      connectSocket() {},
    };
  }
}
