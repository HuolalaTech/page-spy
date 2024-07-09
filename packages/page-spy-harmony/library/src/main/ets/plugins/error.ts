import atom from '../utils/atom';
import { makeMessage } from '../utils/message';
import socketStore from '../helpers/socket';
import type { SpyConsole, PageSpyPlugin } from '../types';
import errorManager from '@ohos.app.ability.errorManager';

export default class ErrorPlugin implements PageSpyPlugin {
  public name = 'ErrorPlugin';

  public static hasInitd = false;

  private static observerId: number;

  public onInit() {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;

    ErrorPlugin.observerId = errorManager.on('error', {
      onUnhandledException(err) {
        ErrorPlugin.sendMessage(err, null);
      },
    });
  }

  public onReset() {
    errorManager.off('error', ErrorPlugin.observerId);
    ErrorPlugin.hasInitd = false;
  }

  public static sendMessage(
    data: any,
    errorDetail: SpyConsole.DataItem['errorDetail'] | null,
  ) {
    // Treat `error` data as `console`
    const error = {
      logType: 'error',
      logs: [atom.transformToAtom(data)],
      time: Date.now(),
      url: '',
      errorDetail,
    };
    const message = makeMessage('console', error);
    socketStore.dispatchEvent('public-data', message);
    socketStore.broadcastMessage(message);
  }
}
