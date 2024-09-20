import { atom, formatErrorObj, makeMessage } from '@huolala-tech/page-spy-base';
import type {
  SpyConsole,
  PageSpyPlugin,
  OnInitParams,
} from '@huolala-tech/page-spy-types';
import socketStore from '../helpers/socket';
import { InitConfig } from '../config';

export default class ErrorPlugin implements PageSpyPlugin {
  public name = 'ErrorPlugin';

  public static hasInitd = false;

  public $pageSpyConfig: InitConfig | null = null;

  public onInit({ config }: OnInitParams<InitConfig>) {
    if (ErrorPlugin.hasInitd) return;
    ErrorPlugin.hasInitd = true;

    this.$pageSpyConfig = config;
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

  public onUncaughtError() {
    window.addEventListener('error', this.uncaughtErrorListener);
  }

  public onResourceLoadError() {
    // Resource load failed
    // Track the error on capture-phase
    window.addEventListener('error', this.resourceLoadErrorListener, true);
  }

  public onUnhandledRejectionError() {
    // Promise unhandledRejection Error
    window.addEventListener('unhandledrejection', this.rejectionListener);
  }

  public uncaughtErrorListener = (e: ErrorEvent) => {
    if (e.error) {
      const { message, stack } = e.error;
      const errorDetail = formatErrorObj(e.error);
      this.sendMessage(stack || message, errorDetail);
    } else {
      // When the error does not exist, use default information
      const defaultMessage =
        e.message ||
        '[PageSpy] An unknown error occurred and no stack trace available';
      this.sendMessage(defaultMessage, null);
    }
  };

  public resourceLoadErrorListener = (evt: Event) => {
    if (!(evt instanceof ErrorEvent)) {
      const { target } = evt as any;
      this.sendMessage(
        `[PageSpy] Resource Load Error: Cannot load resource of (${
          target.src || target.href
        })`,
        null,
      );
    }
  };

  public rejectionListener = (evt: PromiseRejectionEvent) => {
    const errorDetail = formatErrorObj(evt.reason);
    this.sendMessage(evt.reason, errorDetail);
  };

  public sendMessage(
    data: any,
    errorDetail: SpyConsole.DataItem['errorDetail'] | null,
  ) {
    // Treat `error` data as `console`
    const error = {
      logType: 'error',
      logs: [data],
      time: Date.now(),
      url: window.location.href,
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
