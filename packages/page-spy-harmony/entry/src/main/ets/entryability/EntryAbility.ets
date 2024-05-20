import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';
import { PageSpy, TestPersistStorage } from '@huolala/page-spy-harmony';
import axios from '../api/axios'
import dataPreferences from '@ohos.data.preferences'
import { util } from '@kit.ArkTS';


export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onCreate');
  }

  onDestroy(): void {
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/Index', (err) => {
      // PersistentStorage.persistProp('test-persist-storage', '123');
      //
      // setTimeout(() => {
      //   console.log('业务代码获取', AppStorage.get('test-persist-storage'))
      // }, 3000)
      //
      // new TestPersistStorage()

      const cacheKey = 'page-spy-room'
      let preferences: dataPreferences.Preferences | null = null;
      const options: dataPreferences.Options = {
        name: cacheKey
      }
      preferences = dataPreferences.getPreferencesSync(this.context, options)
      if (preferences.hasSync(cacheKey)) {
        const cache = preferences.getSync(cacheKey, new Uint8Array(0)) as Uint8Array;
        const result = util.TextDecoder.create('utf-8').decodeWithStream(cache);
        console.log('✅找到缓存信息: ', result)
      } else {
        console.log('❌未找到缓存信息')
        const cache = new util.TextEncoder().encodeInto(JSON.stringify({
          roomUrl: '',
          project: '',
          title: '',
          address: '',
          useSecret: false,
          secret: ''
        }));
        preferences.putSync(cacheKey, cache);
        preferences.flush((err) => {
          if (err) {
            console.log('❌写入失败')
            return
          }
          console.log('✅写入成功')
        })
      }

      if (err.code) {
        hilog.error(0x0000, 'testTag', 'Failed to load the content. Cause: %{public}s', JSON.stringify(err) ?? '');
        return;
      }
      hilog.info(0x0000, 'testTag', 'Succeeded in loading the content.');
    });
  }

  onWindowStageDestroy(): void {
    // Main window is destroyed, release UI related resources
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onWindowStageDestroy');
  }

  onForeground(): void {
    // Ability has brought to foreground
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onForeground');
  }

  onBackground(): void {
    // Ability has back to background
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onBackground');
  }
}
