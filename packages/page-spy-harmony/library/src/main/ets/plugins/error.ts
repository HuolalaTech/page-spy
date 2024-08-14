import atom from '../utils/atom';
import { makeMessage } from '../utils/message';
import socketStore from '../helpers/socket';
import type {
  SpyConsole,
  PageSpyPlugin,
  InitConfig,
  OnInitParams,
} from '../types';
import errorManager from '@ohos.app.ability.errorManager';

export default class ErrorPlugin implements PageSpyPlugin {
  public name = 'ErrorPlugin';

  public static hasInitd = false;

  public static observerId: number;

  public $pageSpyConfig: InitConfig | null = null;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;

    this.$pageSpyConfig = config;
    const that = this;
    ErrorPlugin.observerId = errorManager.on('error', {
      onUnhandledException(err) {
        that.sendMessage(err, null);
      },
    });
  }

  public onReset() {
    errorManager.off('error', ErrorPlugin.observerId);
    ErrorPlugin.hasInitd = false;
  }

  public sendMessage(
    data: any,
    errorDetail: SpyConsole.DataItem['errorDetail'] | null,
  ) {
    // Treat `error` data as `console`
    const error = {
      logType: 'error',
      logs: [data],
      time: Date.now(),
      url: '',
      errorDetail,
    };
    const processedByUser = this.$pageSpyConfig?.dataProcessor?.console?.(
      error as SpyConsole.DataItem,
    );
    if (processedByUser === false) return;

    error.logs = error.logs.map((l) => atom.transformToAtom(l));
    const message = makeMessage('console', error);
    socketStore.dispatchEvent('public-data', message);
    socketStore.broadcastMessage(message);
  }
}
