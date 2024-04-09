import http from '@ohos.net.http'
import Logger from '../utils/logger'

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
            const a = Object.getOwnPropertyDescriptor(http, 'createHttp');

            const httpReq = http.createHttp();
            try {
              const res = await httpReq.request('https://jsonplaceholder.typicode.com/users/1', {
                method: http.RequestMethod.GET,
                expectDataType: http.HttpDataType.OBJECT
              })
              console.log('响应数据', res.result);
            } catch(e) {
              console.log('[PageSpy] error', e.message)
            } finally {
              httpReq.destroy()
            }
          })
      }
      .width('100%')
    }
    .height('100%')
  }
}