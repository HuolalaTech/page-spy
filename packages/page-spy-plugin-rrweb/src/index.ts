import {
  InitConfigBase,
  OnInitParams,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types';
import { record } from 'rrweb';
import type { recordOptions } from 'rrweb/typings/types';
import type { eventWithTime, listenerHandler } from '@rrweb/types';
import { isBrowser, psLog } from '@huolala-tech/page-spy-base/dist/utils';
import { makeMessage } from '@huolala-tech/page-spy-base/dist/message';

interface Options extends recordOptions<eventWithTime> {
  // The data from 'rrweb-event' is typically larger (more interactions and complex
  // webpage structures result in larger data volumes). When developers debug,
  // real-time transmission can impose a burden on network overhead, and page interactions
  // are not always critical information. Considering these factors, this plugin only
  // dispatch the 'public-data' event for statistical plugins to collect. If you want
  // to view page interactions online during debugging, set it to true.
  allowOnline?: true;
}

export default class RRWebPlugin implements PageSpyPlugin {
  public name = 'RRWebPlugin';

  public stopListener: listenerHandler | null = null;

  public static hasInited = false;

  constructor(public options: Options = {}) {}

  public onInit({ socketStore }: OnInitParams<InitConfigBase>) {
    if (!isBrowser()) {
      psLog.warn(`${this.name} can only used in browser environment`);
      return;
    }
    if (!MutationObserver) {
      psLog.warn(
        `${this.name} built on the MutationObserver API and it's not detected in the current browser`,
      );
      return;
    }
    if (RRWebPlugin.hasInited) return;
    RRWebPlugin.hasInited = true;

    const { allowOnline = false, ...rest } = this.options;

    const handler = record({
      ...rest,
      emit(evt) {
        const data = makeMessage('rrweb-event', evt);
        socketStore.dispatchEvent('public-data', data);
        if (allowOnline) {
          // TODO
          // socketStore.broadcastMessage(data);
        }
      },
    });
    socketStore.addListener('harbor-clear', () => {
      record.takeFullSnapshot();
    });
    if (handler) {
      this.stopListener = handler;
    }
  }

  public onReset() {
    this.stopListener?.();
    RRWebPlugin.hasInited = false;
  }
}
