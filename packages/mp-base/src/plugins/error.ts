/* eslint-disable class-methods-use-this */
import atom from 'base/src/atom';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'base/src/message';
import socketStore from 'mp-base/src/helpers/socket';
import type {
  SpyConsole,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types/index';
import { mp } from '../utils';

// const formatErrorObj = (err: Error) => {
//   if (typeof err !== 'object') return null;
//   const { name, message, stack } = Object(err);
//   if ([name, message, stack].every(Boolean) === false) {
//     return null;
//   }
//   return {
//     name,
//     message,
//     stack,
//   };
// };

export default class ErrorPlugin implements PageSpyPlugin {
  public name = 'ErrorPlugin';

  public static hasInitd = false;

  public onCreated() {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;

    this.onUncaughtError();
    this.onUnhandledRejectionError();
  }

  private onUncaughtError() {
    if (mp.canIUse('onError')) {
      mp.onError((error) => {
        if (error.stack || error.message) {
          /* c8 ignore start */
          const { message, stack } = error;
          ErrorPlugin.sendMessage(stack || message, {
            name: 'uncaught error',
            ...error,
          });
          /* c8 ignore stop */
        } else {
          // When the error does not exist, use default information
          const defaultMessage =
            '[PageSpy] An unknown error occurred and no message or stack trace available';
          ErrorPlugin.sendMessage(defaultMessage, null);
        }
      });
    }
  }

  private onUnhandledRejectionError() {
    // Promise unhandledRejection Error
    if (mp.canIUse('onUnHandledRejection')) {
      mp.onUnHandledRejection((evt) => {
        ErrorPlugin.sendMessage('UnHandled Rejection', {
          name: 'unhandledrejection',
          message: evt.reason,
        });
      });
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
    const message = makeMessage(DEBUG_MESSAGE_TYPE.CONSOLE, error);
    socketStore.broadcastMessage(message);
  }
}
