import { atom } from '@huolala-tech/page-spy-base/dist/atom';
import { makeMessage } from '@huolala-tech/page-spy-base/dist/message';
import { formatErrorObj } from '@huolala-tech/page-spy-base/dist/utils';
import type {
  SpyConsole,
  PageSpyPlugin,
  SpyMP,
  OnInitParams,
} from '@huolala-tech/page-spy-types/index';
import socketStore from '../helpers/socket';
import { getMPSDK, getOriginMPSDK } from '../helpers/mp-api';

// TODO this plugin should test on multiple platforms
export default class ErrorPlugin implements PageSpyPlugin {
  public name = 'ErrorPlugin';

  public static hasInitd = false;

  constructor() {
    this.errorHandler = this.errorHandler.bind(this);
    this.unhandledRejectionHandler = this.unhandledRejectionHandler.bind(this);
  }

  public $pageSpyConfig: SpyMP.MPInitConfig | null = null;

  public onInit({ config }: OnInitParams<SpyMP.MPInitConfig>) {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;

    this.$pageSpyConfig = config;
    this.onUncaughtError();
    this.onUnhandledRejectionError();
  }

  public onReset() {
    const mp = getOriginMPSDK();
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
      this.sendMessage(stack || message, formatErrorObj(error));
      /* c8 ignore stop */
    } else {
      // When the error does not exist, use default information
      const defaultMessage =
        '[PageSpy] An unknown error occurred and no message or stack trace available';
      this.sendMessage(defaultMessage, null);
    }
  }

  public unhandledRejectionHandler(evt: { reason: string }) {
    if (!ErrorPlugin.hasInitd) {
      return;
    }
    this.sendMessage('UnHandled Rejection', {
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

  public sendMessage(
    data: any,
    errorDetail: SpyConsole.DataItem['errorDetail'] | null,
  ) {
    // Treat `error` data as `console`
    const error = {
      logType: 'error',
      logs: [data],
      time: Date.now(),
      // TODO: more mp types
      url: 'wx:light-app', // window.location.href,
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
