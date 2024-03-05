import { makeMessage } from 'base/src/message';
import socketStore from 'page-spy-browser/src/helpers/socket';
import type { SpyConsole, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import atom from 'base/src/atom';

export default class ConsolePlugin implements PageSpyPlugin {
  public name: string = 'ConsolePlugin';

  public static hasInitd = false;

  private proxyTypes: SpyConsole.ProxyType[] = [
    'log',
    'info',
    'error',
    'warn',
    'debug',
  ];

  private console: Record<string, any> = {};

  // eslint-disable-next-line class-methods-use-this
  public async onInit() {
    if (ConsolePlugin.hasInitd) return;
    ConsolePlugin.hasInitd = true;

    this.proxyTypes.forEach((item) => {
      this.console[item] =
        window.console[item] || window.console.log || (() => {});
      window.console[item] = (...args: any[]) => {
        this.printLog({
          logType: item,
          logs: args,
          url: window.location.href,
        });
      };
    });
  }

  public onReset() {
    this.proxyTypes.forEach((item) => {
      window.console[item] = this.console[item];
    });
    ConsolePlugin.hasInitd = false;
  }

  private printLog(data: SpyConsole.DataItem) {
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
