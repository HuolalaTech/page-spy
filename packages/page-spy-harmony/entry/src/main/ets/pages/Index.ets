import { handle404, handle500, seeErrorResponse, normalRequest } from '../api';
import deviceInfo from '@ohos.deviceInfo';
import { getOwnPropertyDescriptor, getOwnPropertyDescriptors } from './utils';


@Entry
@Component
struct Index {
  build() {
    Row() {
      Column() {
        Flex({ justifyContent: FlexAlign.Center, alignItems: ItemAlign.Start, direction: FlexDirection.Column }) {

          Button('Console')
            .margin({ bottom: 20 })
            .onClick(() => {
              console.log('基本类型的数据', 'OpenHarmony', 123, true)
              console.log('复杂类型 - 对象字面量', {
                name: "@huolala/page-spy-harmony",
                description: "PageSpy 让排障更简单"
              })
              console.log('复杂类型 - 字符串对象', new String("OpenHarmony"))
              console.log('复杂类型 - 数组', ['Hello', 'OpenHarmony'])
              console.log('复杂类型 - 集合', new Set([1, 2, 3, 1]))

              console.debug('这是一条 debug 日志')
              console.info('这是一条 info 日志')
              console.warn('这是一条 warn 日志')
              console.error('这是一条 error 日志')
            })


          Button("Error")
            .onClick(() => {
              throw new Error('手动 throw Error')
            })


          Button("Network (基于 @ohos/axios)")
            .onClick(() => {
              normalRequest();
              handle404();
              handle500();
              seeErrorResponse();
            })


          Button("Storage")
            .onClick(() => {
              AppStorage.setOrCreate('basic-type', 'The string content')
              AppStorage.setOrCreate('list-type', [1, 2, 3])
              AppStorage.setOrCreate('object-type', { what: 'Hello harmony' })
            })
        }

      }
      .width('100%')
    }
    .height('100%')
  }
}