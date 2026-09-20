import { makeMessage } from '@huolala-tech/page-spy-base';
import type {
  Client,
  SpySystem,
  PageSpyPlugin,
  OnInitParams,
} from '@huolala-tech/page-spy-types';
import socketStore from '../helpers/socket';
import { InitConfig } from '../config';

/** System 插件：上报 Lynx 客户端系统信息，并响应远端刷新请求。 */
export default class SystemPlugin implements PageSpyPlugin {
  /** 插件名称。 */
  public name = 'SystemPlugin';

  public static hasInitd = false;

  public $pageSpyConfig: InitConfig | null = null;

  /** PageSpy Client 中保存了格式化后的客户端信息和 rawInfo。 */
  public client: Client | null = null;

  /** 初始化时立即推送一次系统信息，并监听远端 refresh 请求。 */
  public onInit({ config, client }: OnInitParams<InitConfig>) {
    if (SystemPlugin.hasInitd) return;
    SystemPlugin.hasInitd = true;

    this.$pageSpyConfig = config;
    this.client = client ?? null;
    this.onceInitPublicData();

    socketStore.addListener('refresh', ({ source }, reply) => {
      const { data } = source;
      if (data === 'system') {
        const info = this.getSystemInfo();
        if (info === null) return;

        reply(info);
      }
    });
  }

  /** 首次初始化后把系统信息写入 public-data，供调试面板展示。 */
  public onceInitPublicData() {
    const info = this.getSystemInfo();
    if (info === null) return;

    socketStore.dispatchEvent('public-data', info);
  }

  /** 重置初始化标记，下一次初始化可重新注册监听。 */
  public onReset() {
    SystemPlugin.hasInitd = false;
  }

  /** 生成系统信息消息，允许用户 dataProcessor 拦截。 */
  public getSystemInfo() {
    const info = {
      system: {
        ua: this.client?.getName(),
        ...(this.client?.rawInfo || {}),
      },
      features: {},
    } as SpySystem.DataItem;
    const processedByUser = this.$pageSpyConfig?.dataProcessor?.system?.(info);

    if (processedByUser === false) return null;
    return makeMessage('system', info);
  }
}
