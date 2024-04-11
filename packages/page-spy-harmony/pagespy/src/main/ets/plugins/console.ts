import { makeMessage } from '../utils/message';
import socketStore from '../helpers/socket';
import type { SpyConsole, PageSpyPlugin } from '../types';
import atom from '../utils/atom';
import router from '@ohos.router';

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

  public async onInit() {
    if (ConsolePlugin.hasInitd) return;
    ConsolePlugin.hasInitd = true;

    this.proxyTypes.forEach((item) => {
      this.console[item] = console[item] || console.log || (() => {});
      console[item] = (...args: any[]) => {
        const { name, path } = router.getState();
        this.printLog({
          logType: item,
          logs: args,
          url: path + name,
        });
      };
    });
  }

  public onReset() {
    this.proxyTypes.forEach((item) => {
      console[item] = this.console[item];
    });
    ConsolePlugin.hasInitd = false;
  }

  private printLog(data: SpyConsole.DataItem) {
    if (data.logs && data.logs.length) {
      this.console[data.logType](...data.logs);
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
