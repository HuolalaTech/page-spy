import { atom, makeMessage, formatErrorObj } from '@huolala-tech/page-spy-base';
import type {
  SpyConsole,
  PageSpyPlugin,
  OnInitParams,
} from '@huolala-tech/page-spy-types/index';
import { ErrorHandlerCallback } from 'react-native';
// @ts-ignore
import LocalPromise from 'promise/setimmediate/es6-extensions';
// @ts-ignore
import RejectTracking from 'promise/setimmediate/rejection-tracking';
import socketStore from '../helpers/socket';
import { InitConfig } from '../config';
import { getGlobal } from '../utils';

// TODO this plugin should test on multiple platforms
export default class ErrorPlugin implements PageSpyPlugin {
  public name = 'ErrorPlugin';

  public static hasInitd = false;

  public originHandler: ErrorHandlerCallback | null = null;

  public originPromise: Promise<any> | null = null;

  public $pageSpyConfig: InitConfig | null = null;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;

    this.$pageSpyConfig = config;
    this.onUncaughtError();
    this.onUnhandledRejectionError();
  }

  public onUncaughtError() {
    const originHandler = ErrorUtils.getGlobalHandler();
    if (originHandler) {
      this.originHandler = originHandler;
    }

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.errorHandler(error);
      if (originHandler) {
        originHandler(error, isFatal);
      }
    });
  }

  public onUnhandledRejectionError() {
    if (!ErrorPlugin.hasInitd) {
      return;
    }
    const g = getGlobal();
    // @ts-ignore
    this.originPromise = g.Promise;
    g.Promise = LocalPromise;
    RejectTracking.enable({
      allRejections: true,
      onUnhandled: (id: any, error: any) => {
        this.errorHandler(error);
        // origin error message
        console.warn('Possible Unhandled Promise Rejection (id: ' + id + '):');
        const errStr = (error && (error.stack || error)) + '';
        errStr.split('\n').forEach((line) => {
          console.warn('  ' + line);
        });
      },
    });
    // ErrorPlugin.sendMessage('UnHandled Rejection', {
    //   name: 'unhandledrejection',
    //   message: evt.reason,
    // });
  }

  public errorHandler(error: Error) {
    if (!ErrorPlugin.hasInitd) {
      return;
    }
    if (error.message || error.stack) {
      const errorDetail = formatErrorObj(error);
      this.sendMessage(error.stack || error.message, errorDetail);
    } else if (typeof error === 'string') {
      this.sendMessage(error, null);
    } else {
      const defaultMessage =
        '[PageSpy] An unknown error occurred and no message or stack trace available';
      this.sendMessage(defaultMessage, error);
    }
  }

  public onReset() {
    if (!ErrorPlugin.hasInitd) {
      return;
    }
    if (this.originHandler) {
      ErrorUtils.setGlobalHandler(this.originHandler);
    }
    if (this.originPromise) {
      // @ts-ignore
      global.Promise = this.originPromise;
    }
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
