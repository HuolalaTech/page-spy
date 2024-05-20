import UIAbility from '@ohos.app.ability.UIAbility';
import { psLog } from '.';
import dataPreferences from '@ohos.data.preferences';
import { ROOM_SESSION_KEY } from './constants';
import util from '@ohos.util';

export interface RoomInfo {
  name: string;
  address: string;
  roomUrl: string;
  project: string;
  title: string;
  useSecret: boolean;
  secret: string;
}

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
    if (!(await this.preferences.has(ROOM_SESSION_KEY))) return null;

    const cache = (await this.preferences.get(
      ROOM_SESSION_KEY,
      new Uint8Array(0),
    )) as Uint8Array;
    const jsonString = util.TextDecoder.create('utf-8').decodeWithStream(cache);
    this._readCache = JSON.parse(jsonString);
    return this._readCache;
  }

  async set<T extends keyof RoomInfo>(key: T, value: RoomInfo[T]) {
    const info = await this.get();
    if (info === null) return false;

    const newInfo: RoomInfo = Object.assign(info, {
      [key]: value,
    });

    try {
      await this.preferences.put(ROOM_SESSION_KEY, JSON.stringify(info));
      await util.promisify(this.preferences.flush)();
      this._readCache = newInfo;
      return true;
    } catch (e) {
      psLog.warn(e.message);
      return false;
    }
  }
}
