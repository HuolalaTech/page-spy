/* eslint-disable class-methods-use-this */
import atom from 'src/utils/atom';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'src/utils/socket';
import type { SpyConsole } from 'types';
import type PageSpyPlugin from './index';

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

  public onCreated() {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;

    this.onUncaughtError();
    this.onResourceLoadError();
    this.onUnhandledRejectionError();
  }

  private onUncaughtError() {
    const errorHandler = (e: ErrorEvent) => {
      if (e.error) {
        const { message, stack } = e.error;
        const errorDetail = formatErrorObj(e.error);
        ErrorPlugin.sendMessage(stack || message, errorDetail);
      } else {
        // When the error does not exist, use default information
        const defaultMessage = 'An unknown error occurred';
        const defaultStack = 'No stack trace available';
        ErrorPlugin.sendMessage(defaultMessage, {
          name: '',
          message: defaultMessage,
          stack: defaultStack,
        });
      }
    };
    window.addEventListener('error', errorHandler);
  }

  private onResourceLoadError() {
    // Resource load failed
    // Track the error on capture-phase
    window.addEventListener(
      'error',
      (evt: Event) => {
        if (!(evt instanceof ErrorEvent)) {
          ErrorPlugin.sendMessage(
            `Resource Load Error: Cannot load resource of (${
              (evt.target! as any).src
            })`,
            null,
          );
        }
      },
      true,
    );
  }

  private onUnhandledRejectionError() {
    // Promise unhandledRejection Error
    window.addEventListener(
      'unhandledrejection',
      (evt: PromiseRejectionEvent) => {
        const errorDetail = formatErrorObj(evt.reason);
        ErrorPlugin.sendMessage(evt.reason, errorDetail);
      },
    );
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
    const message = makeMessage(DEBUG_MESSAGE_TYPE.CONSOLE, error);
    socketStore.broadcastMessage(message);
  }
}
