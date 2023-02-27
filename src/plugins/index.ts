export default abstract class PageSpyPlugin {
  constructor(public name: string) {}
  // 加载后立即生效
  abstract onCreated?(): void;
  // 用户主动触发的回调
  abstract onLoaded?(): void;
}
