import { makeMessage } from '../utils/message';
import socketStore from '../helpers/socket';
import type {
  SpyConsole,
  PageSpyPlugin,
  SpyBase,
  InitConfig,
  OnInitParams,
} from '../types';
import atom from '../utils/atom';
import router from '@ohos.router';
import { getRandomId } from '../utils';

export default class ConsolePlugin implements PageSpyPlugin {
  public name: string = 'ConsolePlugin';

  public static hasInitd = false;

  public proxyTypes: SpyConsole.ProxyType[] = [
    'log',
    'info',
    'error',
    'warn',
    'debug',
  ];

  public console: Record<string, any> = {};

  public $pageSpyConfig: InitConfig | null = null;

  public async onInit({ config }: OnInitParams<InitConfig>) {
    if (ConsolePlugin.hasInitd) return;
    ConsolePlugin.hasInitd = true;

    socketStore.addListener('debug', ConsolePlugin.handleDebugger);

    this.$pageSpyConfig = config;
    this.init();
  }

  public init() {
    this.proxyTypes.forEach((item) => {
      this.console[item] = console[item] || console.log || (() => {});
      console[item] = (...args: any[]) => {
        let url: string;
        try {
          const { name = '', path = '' } = router?.getState() || {};
          url = path + name;
        } catch (e) {
          url = 'Context unready';
        }
        this.printLog({
          logType: item,
          logs: args,
          url,
        });
      };
    });
  }

  public reset() {
    this.proxyTypes.forEach((item) => {
      console[item] = this.console[item];
    });
  }

  public onReset() {
    this.reset();
    ConsolePlugin.hasInitd = false;
  }

  public static handleDebugger(
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
