interface UserInfo {
  name: string;
  age: number
}

PersistentStorage.persistProp<UserInfo>('user-info', {
  name: 'Blucas',
  age: 28
});


@Entry
@Component
export default struct PersistStorageDemo {
  @StorageLink('user-info') user: UserInfo = {
    name: 'None',
    age: 0
  };

  build() {
    Row() {
      Column() {
        Text(`姓名: ${this.user.name}, 年龄: ${this.user.age}`)
        Button("update")
          .onClick(() => {
            this.user = {
              name: 'Amber',
              age: 31
            }
          })
      }
    }
  }
}
