import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'miniprogram/helpers/socket';
import type { SpyConsole } from 'types';
import atom from 'src/utils/atom';
import type PageSpyPlugin from 'src/utils/plugin';
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
    type.forEach((item) => {
      this.console[item] = globalThis.console[item];
      globalThis.console[item] = (...args: any[]) => {
        const page = getCurrentPages().pop();
        const url =
          (page && page.route + '?' + joinQuery(page.options || {})) || '/';
        this.printLog({
          logType: item,
          logs: args,
          url,
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
