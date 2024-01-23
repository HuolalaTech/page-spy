import { OnInitParams, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { record } from 'rrweb';
import type { recordOptions } from 'rrweb/typings/types';
import type { eventWithTime, listenerHandler } from '@rrweb/types';
import { DEBUG_MESSAGE_TYPE, makeMessage } from 'base/src/message';
import { PUBLIC_DATA } from 'base/src/message/debug-type';
import { isBrowser, psLog } from 'base/src';

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

  public onInit({ socketStore }: OnInitParams) {
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
        const data = makeMessage(DEBUG_MESSAGE_TYPE.RRWEB_EVENT, evt);

        socketStore.dispatchEvent(PUBLIC_DATA, data);
        if (allowOnline) {
          socketStore.broadcastMessage(data);
        }
      },
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
