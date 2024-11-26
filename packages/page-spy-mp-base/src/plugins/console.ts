import type {
  SpyConsole,
  PageSpyPlugin,
  OnInitParams,
  InitConfigBase,
} from '@huolala-tech/page-spy-types/index';
import { atom } from '@huolala-tech/page-spy-base/dist/atom';
import { makeMessage } from '@huolala-tech/page-spy-base/dist/message';
import socketStore from '../helpers/socket';
import { joinQuery } from '../utils';

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

  public $pageSpyConfig: InitConfigBase | null = null;

  // eslint-disable-next-line class-methods-use-this
  public async onInit({ config }: OnInitParams<InitConfigBase>) {
    if (ConsolePlugin.hasInitd) return;
    ConsolePlugin.hasInitd = true;

    this.$pageSpyConfig = config;
    this.init();
  }

  public init() {
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

  public reset() {
    this.proxyTypes.forEach((item) => {
      const originFn = this.console[item];
      if (originFn) {
        console[item] = originFn;
      }
    });
  }

  public onReset() {
    this.reset();
    ConsolePlugin.hasInitd = false;
  }

  public printLog(data: SpyConsole.DataItem) {
    if (data.logs && data.logs.length) {
      const processor = this.$pageSpyConfig?.dataProcessor?.console;
      if (processor) {
        this.reset();
        const processedByUser = processor(data);
        this.init();

        if (processedByUser === false) return;
      }

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
