import { makeMessage } from '../utils/message';
import socketStore from '../helpers/socket';
import type { SpyConsole, PageSpyPlugin, SpyBase } from '../types';
import atom from '../utils/atom';
import router from '@ohos.router';
import { getRandomId } from '../utils';

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

    socketStore.addListener('debug', ConsolePlugin.handleDebugger);

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

  private static handleDebugger(
    { source }: SpyBase.InteractiveEvent<string>,
    reply: (data: any) => void,
  ) {
    const { type, data } = source;
    if (type === 'debug') {
      const originMsg = makeMessage('console', {
        logType: 'debug-origin',
        logs: [
          {
            id: getRandomId(),
            type: 'debug-origin',
            value: data,
          },
        ],
      });
      reply(originMsg);
      try {
        // TODO
        const result = '🚧 动态执行函数暂未开放，敬请期待 ...';
        const evalMsg = makeMessage('console', {
          logType: 'debug-eval',
          logs: [atom.transformToAtom(result)],
        });
        reply(evalMsg);
      } catch (err) {
        const errMsg = makeMessage('console', {
          logType: 'error',
          logs: [
            {
              type: 'error',
              value: (err as Error).stack,
            },
          ],
        });
        reply(errMsg);
      }
    }
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
