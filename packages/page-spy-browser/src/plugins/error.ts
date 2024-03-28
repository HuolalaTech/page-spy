/* eslint-disable class-methods-use-this */
import atom from 'base/src/atom';
import { makeMessage } from 'base/src/message';
import socketStore from 'page-spy-browser/src/helpers/socket';
import type { SpyConsole, PageSpyPlugin } from '@huolala-tech/page-spy-types';

const formatErrorObj = (err: Error) => {
  if (typeof err !== 'object') return null;
  const { name, message, stack } = Object(err);
  if ([name, message, stack].every(Boolean) === false) {
    return null;
  }
  return {
    name,
    message,
    stack,
  };
};

export default class ErrorPlugin implements PageSpyPlugin {
  public name = 'ErrorPlugin';

  public static hasInitd = false;

  private uncaughtErrorListener = (e: ErrorEvent) => {
    if (e.error) {
      const { message, stack } = e.error;
      const errorDetail = formatErrorObj(e.error);
      ErrorPlugin.sendMessage(stack || message, errorDetail);
    } else {
      // When the error does not exist, use default information
      const defaultMessage =
        '[PageSpy] An unknown error occurred and no stack trace available';
      ErrorPlugin.sendMessage(defaultMessage, null);
    }
  };

  private resourceLoadErrorListener = (evt: Event) => {
    if (!(evt instanceof ErrorEvent)) {
      const { target } = evt as any;
      ErrorPlugin.sendMessage(
        `[PageSpy] Resource Load Error: Cannot load resource of (${
          target.src || target.href
        })`,
        null,
      );
    }
  };

  private rejectionListener = (evt: PromiseRejectionEvent) => {
    const errorDetail = formatErrorObj(evt.reason);
    ErrorPlugin.sendMessage(evt.reason, errorDetail);
  };

  public onInit() {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;

    this.onUncaughtError();
    this.onResourceLoadError();
    this.onUnhandledRejectionError();
  }

  public onReset() {
    window.removeEventListener('error', this.uncaughtErrorListener);
    window.removeEventListener('error', this.resourceLoadErrorListener);
    window.removeEventListener('unhandledrejection', this.rejectionListener);
    ErrorPlugin.hasInitd = false;
  }

  private onUncaughtError() {
    window.addEventListener('error', this.uncaughtErrorListener);
  }

  private onResourceLoadError() {
    // Resource load failed
    // Track the error on capture-phase
    window.addEventListener('error', this.resourceLoadErrorListener, true);
  }

  private onUnhandledRejectionError() {
    // Promise unhandledRejection Error
    window.addEventListener('unhandledrejection', this.rejectionListener);
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
      url: window.location.href,
      errorDetail,
    };
    const message = makeMessage('console', error);
    socketStore.dispatchEvent('public-data', message);
    socketStore.broadcastMessage(message);
  }
}
