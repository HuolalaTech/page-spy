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
  // 是否开启实时模式
  liveMode?: boolean;
}

export default class RRWebPlugin implements PageSpyPlugin {
  public name = 'RRWebPlugin';

  public stopListener: listenerHandler | null = null;

  public static hasInited = false;

  // 当开发者在调试端进入 Page 菜单时激活
  private _playerIsInViewport = false;

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

    const { liveMode = false, ...rest } = this.options;

    const handler = record({
      ...rest,
      emit: (evt) => {
        const data = makeMessage('rrweb-event', evt);
        socketStore.dispatchEvent('public-data', data);
        // if (liveMode && this._playerIsInViewport) {
        if (liveMode) {
          socketStore.broadcastMessage(data, true);
        }
      },
    });
    if (liveMode) {
      socketStore.addListener('rrweb-player-in-viewport', () => {
        this._playerIsInViewport = true;
        record.takeFullSnapshot();
      });
      socketStore.addListener('rrweb-player-leave-viewport', () => {
        this._playerIsInViewport = false;
      });
    }

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
