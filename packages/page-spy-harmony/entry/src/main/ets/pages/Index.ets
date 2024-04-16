import deviceInfo from '@ohos.deviceInfo'
import router from '@ohos.router'
import http from '@ohos.net.http'
import { handle404, handle500, seeErrorResponse, seeRequestInfo } from '../api'
import url from '@ohos.url'
import ArrayList from '@ohos.util.ArrayList'

@Entry
@Component
struct Index {
  @State message: string = 'Hello World'

  build() {
    Row() {
      Column() {
        Text(this.message)
          .fontSize(50)
          .fontWeight(FontWeight.Bold)
          .onClick(async () => {
            const page = router.getState()
            console.log('对象字面量', {
              name: 'blucas',
              age: 28,
              likes: [1, 2, 3],
              sets: new Set([1, 2, 3, 1]),
              page
            })

            setInterval(() => {
              console.log('随机数', Math.random());
            }, 1000)

            await Promise.all([seeRequestInfo(), handle404(), handle500()])

            console.log('请求完成')
          })
      }
      .width('100%')
    }
    .height('100%')
  }
}