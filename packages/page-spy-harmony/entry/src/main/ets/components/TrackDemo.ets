class IsNotTrack {
  data1: string = '1';
  data2: string = '2';
}

class IsTrack {
  @Track data3: string = '3';
  @Track data4: string = '4';
}

@Entry
@Component
export default struct TrackDemo {
  @State isNotTrack: IsNotTrack = new IsNotTrack()
  @State isTrack: IsTrack = new IsTrack()

  build() {
    Row() {
      Text(this.isNotTrack.data1)
        .fontSize((() => {
          console.log(`not track 1 render`)
          return 20
        })())
      Text(this.isNotTrack.data2)
        .fontSize((() => {
          console.log(`not track 2 render`)
          return 20
        })())
      Button('Track change').onClick(() => {
        this.isNotTrack.data1 = String(Math.random())
      })

      Text(this.isTrack.data3)
        .fontSize((() => {
          console.log(`not track 3 render`)
          return 20
        })())
      Text(this.isTrack.data4)
        .fontSize((() => {
          console.log(`not track 4 render`)
          return 20
        })())
      Button('Track change').onClick(() => {
        this.isTrack.data3 = String(Math.random())
      })
    }
  }
}