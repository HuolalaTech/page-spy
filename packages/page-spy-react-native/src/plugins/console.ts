import type {
  SpyConsole,
  PageSpyPlugin,
  OnInitParams,
} from '@huolala-tech/page-spy-types';
import { atom, makeMessage } from '@huolala-tech/page-spy-base';
import socketStore from '../helpers/socket';
import type { InitConfig } from '../config';

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

  public $pageSpyConfig: InitConfig | null = null;

  public async onInit({ config }: OnInitParams<InitConfig>) {
    if (ConsolePlugin.hasInitd) return;
    ConsolePlugin.hasInitd = true;

    const that = this;
    this.$pageSpyConfig = config;
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

      const atomLog = makeMessage('console', {
        ...data,
        time: Date.now(),
        logs: data.logs.map((log) => {
          return atom.transformToAtom(log, false);
        }),
      });
      socketStore.broadcastMessage(atomLog);

      if (!this.$pageSpyConfig?.serializeData) {
        socketStore.dispatchEvent('public-data', atomLog);
      } else {
        const serializeLog = {
          ...atomLog,
          data: {
            ...atomLog.data,
            logs: data.logs.map((log) => {
              return atom.transformToAtom(log, true);
            }),
          },
        };
        socketStore.dispatchEvent('public-data', serializeLog);
      }
    }
  }
}
