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
            // const page = router.getState()
            // console.log('对象字面量', {
            //   name: 'blucas',
            //   age: 28,
            //   likes: [1, 2, 3],
            //   sets: new Set([1, 2, 3, 1]),
            //   page
            // })
            //
            // seeErrorResponse()
            //
            // await Promise.all([seeRequestInfo(), handle404(), handle500()])
            //
            // console.log('请求完成')
            let arrayList = new ArrayList();
            let result = arrayList.add("a");
            let result1 = arrayList.add(1);
            let b = [1, 2, 3];
            let result2 = arrayList.add(b);
            let c = {name: "Dylon", age: "13"};
            let result3 = arrayList.add(c);
            let result4 = arrayList.add(false);
            console.log('ArrayList', {
              result,
              result4
            })
          })
      }
      .width('100%')
    }
    .height('100%')
  }
}