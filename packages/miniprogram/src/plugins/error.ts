/* eslint-disable class-methods-use-this */
import atom from 'src/utils/atom';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'miniprogram/helpers/socket';
import type { SpyConsole } from 'types/miniprogram';
import type PageSpyPlugin from 'src/utils/plugin';

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
    if (wx.canIUse('onError')) {
      wx.onError((error) => {
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
    if (wx.canIUse('onUnHandledRejection')) {
      wx.onUnHandledRejection((evt) => {
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
      url: 'wx:light-app', // window.location.href,
      errorDetail,
    };
    const message = makeMessage(DEBUG_MESSAGE_TYPE.CONSOLE, error);
    socketStore.broadcastMessage(message);
  }
}
