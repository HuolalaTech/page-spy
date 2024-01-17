import { OnInitParams, PageSpyPlugin } from '@huolala-tech/page-spy-types';
import { record, pack } from 'rrweb';
import type { recordOptions } from 'rrweb/typings/types';
import type { eventWithTime, listenerHandler } from '@rrweb/types';
import { DEBUG_MESSAGE_TYPE, makeMessage } from 'base/src/message';
import { PUBLIC_DATA } from 'base/src/message/debug-type';
import { isBrowser, psLog } from 'base/src';

export default class RRWebPlugin implements PageSpyPlugin {
  public name = 'RRWebPlugin';

  public stopListener: listenerHandler | null = null;

  public static hasInited = false;

  constructor(public recordOptions: recordOptions<eventWithTime> = {}) {}

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

    const handler = record({
      packFn: pack,
      ...this.recordOptions,
      emit(evt) {
        const data = makeMessage(DEBUG_MESSAGE_TYPE.RRWEB_EVENT, evt);

        socketStore.dispatchEvent(PUBLIC_DATA, data);
        socketStore.broadcastMessage(data);
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
