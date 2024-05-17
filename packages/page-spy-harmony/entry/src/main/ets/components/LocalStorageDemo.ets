
const init: Record<string, number> = {
  'count': 1
}
const storage = new LocalStorage(init)

@Component
struct Child {
  @LocalStorageLink("count") count: number = 0;

  build() {
    Button(`子组件的 count: ${this.count}`)
      .onClick(() => {
        this.count += 1;
      })
  }
}

@Entry(storage)
@Component
struct LocalStorageDemo {
  @LocalStorageLink("count") count: number = 0;

  build() {
    Row() {
      Text(`父组件的 count: ${this.count}`)
      Flex({ direction: FlexDirection.Column, justifyContent: FlexAlign.SpaceEvenly }) {
        Child()
        Child()
      }
    }
  }
}

export default LocalStorageDemo