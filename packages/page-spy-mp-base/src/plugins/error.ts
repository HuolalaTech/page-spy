import { atom, makeMessage, formatErrorObj } from '@huolala-tech/page-spy-base';
import type {
  SpyConsole,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types/index';
import socketStore from '../helpers/socket';
import { getMPSDK } from '../utils';

// TODO this plugin should test on multiple platforms
export default class ErrorPlugin implements PageSpyPlugin {
  public name = 'ErrorPlugin';

  public static hasInitd = false;

  public onInit() {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;

    this.onUncaughtError();
    this.onUnhandledRejectionError();
  }

  public onReset() {
    const mp = getMPSDK();
    if (mp.canIUse('offError')) {
      mp.offError(this.errorHandler);
    }
    if (mp.canIUse('offUnhandledRejection')) {
      mp.offUnhandledRejection(this.unhandledRejectionHandler);
    }
    ErrorPlugin.hasInitd = false;
  }

  public errorHandler(error: { message: string; stack: string }) {
    if (!ErrorPlugin.hasInitd) {
      return;
    }
    if (error.stack || error.message) {
      /* c8 ignore start */
      const { message, stack } = error;
      ErrorPlugin.sendMessage(stack || message, formatErrorObj(error));
      /* c8 ignore stop */
    } else {
      // When the error does not exist, use default information
      const defaultMessage =
        '[PageSpy] An unknown error occurred and no message or stack trace available';
      ErrorPlugin.sendMessage(defaultMessage, null);
    }
  }

  public unhandledRejectionHandler(evt: { reason: string }) {
    if (!ErrorPlugin.hasInitd) {
      return;
    }
    ErrorPlugin.sendMessage('UnHandled Rejection', {
      name: 'unhandledrejection',
      message: evt.reason,
    });
  }

  public onUncaughtError() {
    const mp = getMPSDK();
    if (mp.canIUse('onError')) {
      mp.onError(this.errorHandler);
    }
  }

  public onUnhandledRejectionError() {
    const mp = getMPSDK();
    // Promise unhandledRejection Error
    if (mp.canIUse('onUnhandledRejection')) {
      mp.onUnhandledRejection(this.unhandledRejectionHandler);
    }
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
      // TODO: more mp types
      url: 'wx:light-app', // window.location.href,
      errorDetail,
    };
    const message = makeMessage('console', error);
    socketStore.dispatchEvent('public-data', message);
    socketStore.broadcastMessage(message);
  }
}
