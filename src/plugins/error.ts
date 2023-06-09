/* eslint-disable class-methods-use-this */
import atom from 'src/utils/atom';
import { makeMessage, DEBUG_MESSAGE_TYPE } from 'src/utils/message';
import socketStore from 'src/utils/socket';
import type PageSpyPlugin from './index';

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
      ErrorPlugin.sendMessage(e.error?.stack || e.message);
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
        ErrorPlugin.sendMessage(evt.reason);
      },
    );
  }

  public static sendMessage(data: any) {
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
