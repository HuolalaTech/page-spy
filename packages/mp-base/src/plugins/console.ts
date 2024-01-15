import { makeMessage, DEBUG_MESSAGE_TYPE } from 'base/src/message';
import socketStore from 'mp-base/src/helpers/socket';
import type {
  SpyConsole,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types/index';
import atom from 'base/src/atom';
import { joinQuery } from '../utils';

export default class ConsolePlugin implements PageSpyPlugin {
  public name: string = 'ConsolePlugin';

  private console: Record<string, any> = {};

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public async onCreated() {
    if (ConsolePlugin.hasInitd) return;
    ConsolePlugin.hasInitd = true;

    const type: SpyConsole.ProxyType[] = ['log', 'info', 'error', 'warn'];
    const that = this;
    type.forEach((item) => {
      // Not using globalThis or global, cause "console" exists in any env,
      // but global may be blocked.
      this.console[item] = console[item];
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

  private printLog(data: SpyConsole.DataItem) {
    if (data.logs && data.logs.length) {
      this.console[data.logType](...data.logs);
      // eslint-disable-next-line no-param-reassign
      data.logs = data.logs.map((log) => atom.transformToAtom(log));
      const log = makeMessage(DEBUG_MESSAGE_TYPE.CONSOLE, {
        time: Date.now(),
        ...data,
      });
      socketStore.broadcastMessage(log);
    }
  }
}
