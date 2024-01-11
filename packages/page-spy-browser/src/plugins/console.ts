import { makeMessage, DEBUG_MESSAGE_TYPE } from 'base/src/message';
import socketStore from 'page-spy-browser/src/helpers/socket';
import type { SpyConsole } from '@huolala-tech/page-spy-types';
import atom from 'base/src/atom';
import type { PageSpyPlugin } from '@huolala-tech/page-spy-types';

export default class ConsolePlugin implements PageSpyPlugin {
  public name: string = 'ConsolePlugin';

  private console: Record<string, any> = {};

  public static hasInitd = false;

  // eslint-disable-next-line class-methods-use-this
  public async onCreated() {
    if (ConsolePlugin.hasInitd) return;
    ConsolePlugin.hasInitd = true;

    const type: SpyConsole.ProxyType[] = [
      'log',
      'info',
      'error',
      'warn',
      'debug',
    ];
    type.forEach((item) => {
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
