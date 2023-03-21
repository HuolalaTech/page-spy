import atom from 'src/utils/atom';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'src/utils/socket';
import type PageSpyPlugin from './index';

export default class ErrorPlugin implements PageSpyPlugin {
  name = 'ErrorPlugin';

  error: OnErrorEventHandler = null;

  onCreated() {
    const that = this;
    this.error = window.onerror;

    // Uncaught error
    window.onerror = function (...args) {
      ErrorPlugin.sendMessage(args[4]);
      if (that.error) {
        that.error.apply(window, args);
      }
    };

    // Resource load failed
    window.addEventListener(
      'error',
      (evt: Event) => {
        if (!(evt instanceof ErrorEvent)) {
          ErrorPlugin.sendMessage(
            `Resource Load Error: Cannot load resource of (${
              (evt.target! as any).src
            })`,
          );
        }
      },
      true,
    );

    // Promise unhandleRejection Error
    window.addEventListener(
      'unhandledrejection',
      (evt: PromiseRejectionEvent) => {
        ErrorPlugin.sendMessage(evt.reason);
      },
    );
  }

  static sendMessage(data: any) {
    // Treat `error` data as `console`
    const message = makeMessage(DEBUG_MESSAGE_TYPE.CONSOLE, {
      logType: 'error',
      logs: [atom.transformToAtom(data)],
      time: Date.now(),
      url: window.location.href,
    });
    socketStore.broadcastMessage(message);
  }
}
