import atom from 'base/src/atom';
import { makeMessage } from 'base/src/message';
import type {
  SpyConsole,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types/index';
import socketStore from '../helpers/socket';
import { ErrorHandlerCallback } from 'react-native';
// @ts-ignore
import LocalPromise from 'promise/setimmediate/es6-extensions';
// @ts-ignore
import RejectTracking from 'promise/setimmediate/rejection-tracking';

import { formatErrorObj } from 'base/src';

// TODO this plugin should test on multiple platforms
export default class ErrorPlugin implements PageSpyPlugin {
  public name = 'ErrorPlugin';

  public static hasInitd = false;

  private originHandler: ErrorHandlerCallback | null = null;

  private originPromise: Promise<any> | null = null;

  public onInit() {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;
    this.onUncaughtError();
    this.onUnhandledRejectionError();
  }

  private onUncaughtError() {
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

  private onUnhandledRejectionError() {
    if (!ErrorPlugin.hasInitd) {
      return;
    }
    // @ts-ignore
    this.originPromise = global.Promise;
    global.Promise = LocalPromise;
    RejectTracking.enable({
      allRejections: true,
      onUnhandled: (id: any, error: any) => {
        this.errorHandler(error);
        // origin error message
        console.warn('Possible Unhandled Promise Rejection (id: ' + id + '):');
        var errStr = (error && (error.stack || error)) + '';
        errStr.split('\n').forEach(function (line) {
          console.warn('  ' + line);
        });
      },
    });
    // ErrorPlugin.sendMessage('UnHandled Rejection', {
    //   name: 'unhandledrejection',
    //   message: evt.reason,
    // });
  }

  private errorHandler(error: Error) {
    if (!ErrorPlugin.hasInitd) {
      return;
    }
    if (error.message || error.stack) {
      const errorDetail = formatErrorObj(error);
      ErrorPlugin.sendMessage(error.stack || error.message, errorDetail);
    } else if (typeof error === 'string') {
      ErrorPlugin.sendMessage(error, null);
    } else {
      const defaultMessage =
        '[PageSpy] An unknown error occurred and no message or stack trace available';
      ErrorPlugin.sendMessage(defaultMessage, error);
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
