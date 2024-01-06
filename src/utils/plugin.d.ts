export default abstract class PageSpyPlugin {
  public constructor(public name: string) {}
  // 加载后立即生效
  public abstract onCreated?(): void;
  // 用户主动触发的回调
  public abstract onLoaded?(): void;
}
