import { makeMessage, DEBUG_MESSAGE_TYPE } from 'base/src/message';
import socketStore from 'mp-base/src/helpers/socket';
import type {
  SpyConsole,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types/index';
import atom from 'base/src/atom';
import { PUBLIC_DATA } from 'base/src/message/debug-type';
import { joinQuery } from '../utils';

export default class ConsolePlugin implements PageSpyPlugin {
  public name: string = 'ConsolePlugin';

  private console: Record<string, any> = {};

  public static hasInitd = false;

  private proxyTypes: SpyConsole.ProxyType[] = [
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
          const page = getCurrentPages().pop();
          let url = '/';
          if (page) {
            url = page.route;
            if (page.options && Object.keys(page.options).length > 0) {
              url += '?' + joinQuery(page.options);
            }
          }
          that.printLog({
            logType: item,
            logs: args,
            url,
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

  private printLog(data: SpyConsole.DataItem) {
    if (data.logs && data.logs.length) {
      this.console[data.logType](...data.logs);
      // eslint-disable-next-line no-param-reassign
      data.logs = data.logs.map((log) => atom.transformToAtom(log));
      const log = makeMessage(DEBUG_MESSAGE_TYPE.CONSOLE, {
        time: Date.now(),
        ...data,
      });
      socketStore.dispatchEvent(PUBLIC_DATA, log);
      socketStore.broadcastMessage(log);
    }
  }
}
