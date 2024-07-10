import type { SpyConsole, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { atom, makeMessage } from '@huolala-tech/page-spy-base';
import socketStore from '../helpers/socket';

export default class ConsolePlugin implements PageSpyPlugin {
  public name: string = 'ConsolePlugin';

  public console: Record<string, any> = {};

  public static hasInitd = false;

  public proxyTypes: SpyConsole.ProxyType[] = [
    'log',
    'info',
    'error',
    'warn',
    'debug',
  ];

  // eslint-disable-next-line class-methods-use-this
  public async onInit() {
    if (ConsolePlugin.hasInitd) return;
    ConsolePlugin.hasInitd = true;

    const that = this;
    this.proxyTypes.forEach((item) => {
      // Not using globalThis or global, cause "console" exists in any env,
      // but global may be blocked.
      this.console[item] = console[item] || console.log || (() => {});
      Object.defineProperty(console, item, {
        value(...args: any[]) {
          that.printLog({
            logType: item,
            logs: args,
            url: '',
          });
        },
        configurable: true,
        enumerable: true,
        writable: true,
      });
    });
  }

  public onReset() {
    this.proxyTypes.forEach((item) => {
      console[item] = this.console[item];
    });
    ConsolePlugin.hasInitd = false;
  }

  public printLog(data: SpyConsole.DataItem) {
    if (data.logs && data.logs.length) {
      this.console[data.logType](...data.logs);
      // eslint-disable-next-line no-param-reassign
      data.logs = data.logs.map((log) => atom.transformToAtom(log));
      const log = makeMessage('console', {
        time: Date.now(),
        ...data,
      });
      socketStore.dispatchEvent('public-data', log);
      socketStore.broadcastMessage(log);
    }
  }
}
