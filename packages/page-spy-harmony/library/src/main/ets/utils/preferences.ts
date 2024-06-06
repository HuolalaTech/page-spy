import UIAbility from '@ohos.app.ability.UIAbility';
import { psLog } from '.';
import dataPreferences from '@ohos.data.preferences';
import { ROOM_SESSION_KEY } from './constants';
import util from '@ohos.util';
import { RoomInfo } from '../types';

export class Preferences {
  _readCache: RoomInfo | null = null;

  preferences: dataPreferences.Preferences | null = null;

  constructor(public context: UIAbility['context']) {
    if (!context) {
      psLog.warn("The 'context' field not found in `new PageSpy({ ... })`");
      return;
    }
    this.preferences = dataPreferences.getPreferencesSync(context, {
      name: ROOM_SESSION_KEY,
    });
  }

  async get() {
    if (this._readCache) return this._readCache;
    if (!this.preferences) return null;

    const exist = await this.preferences.has(ROOM_SESSION_KEY);
    if (!exist) return null;

    const cache = await this.preferences.get(
      ROOM_SESSION_KEY,
      new Uint8Array(0),
    );
    let jsonString = cache;
    if (new util.types().isUint8Array(cache)) {
      jsonString = util.TextDecoder.create('utf-8').decodeWithStream(
        cache as Uint8Array,
      );
    }
    this._readCache = JSON.parse(jsonString as string);
    return this._readCache;
  }

  async set(data: Partial<RoomInfo>) {
    if (!data) return false;

    const info = await this.get();
    const necessary = this.isNotEqual(info, data);
    if (necessary === false) {
      return true;
    }

    const newInfo: RoomInfo = {
      ...info,
      ...data,
    };
    try {
      const u8 = new util.TextEncoder().encodeInto(JSON.stringify(newInfo));
      await this.preferences.put(ROOM_SESSION_KEY, u8);
      await this.preferences.flush();
      this._readCache = newInfo;
      return true;
    } catch (e) {
      psLog.warn(e.message);
      return false;
    }
  }

  isNotEqual(saved: RoomInfo, updated: Partial<RoomInfo>) {
    return Object.entries(updated).some(([key, val]) => {
      if (saved?.[key] !== val) return true;
      return false;
    });
  }
}
