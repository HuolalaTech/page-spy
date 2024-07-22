import { AbilityConstant, UIAbility, Want } from '@kit.AbilityKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { window } from '@kit.ArkUI';
import { PageSpy } from '@huolala/page-spy-harmony';
import axios from '../api/axios'


export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onCreate');
  }

  onDestroy(): void {
    hilog.info(0x0000, 'testTag', '%{public}s', 'Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    const $pageSpy = new PageSpy({
      context: this.context,
      api: 'page-spy-web-v.huolala.work',
      enableSSL: true,
      axios,
      project: 'hello-harmony',
      title: '测试 API-11'
    })

    console.log('PageSpy 实例', $pageSpy)
    windowStage.loadContent('pages/Index', (err) => {
      // const name = 'page-spy-room'
      // const preferences = dataPreferences.getPreferencesSync(this.context, {
      //   name,
      // });
      // preferences.deleteSync(name);
      // preferences.flush((err) => {
      //   if (err) {
      //     console.log(err.message);
      //   }
      // });

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
