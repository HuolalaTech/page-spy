import { SocketStoreBase } from '@huolala-tech/page-spy-base';
import { Modal } from './modal';
import { Toast } from './toast';

export interface UpdateConfig {
  title?: string;
  project?: string;
}

interface CommonParams {
  // Some utils class.
  modal?: Modal;
  toast?: Toast;
}

export interface OnInitParams<T extends InitConfigBase> extends CommonParams {
  /**
   * Config info which has merged the user passed value.
   */
  config: Required<T>;

  /**
   * Wrap the origin websocket instance, plugin developers can
   * communicate with Web / API by it.
   */
  socketStore: SocketStoreBase;

  /**
   * The atom instance to store js object info.
   */
  atom?: any;

  /**
   * The client info object.
   */
  client?: Client;
}

export interface OnMountedParams<T extends InitConfigBase>
  extends CommonParams {
  /**
   * Config info which has merged the user passed value.
   */
  config: Required<T>;

  // The root node which has `id="__pageSpy"` in DOM tree.
  root: HTMLDivElement;

  // Wrap the origin socket instance, plugin developers can
  // communicate with Web / API by it.
  socketStore: SocketStoreBase;
}

export type PluginOrder = 'pre' | 'post';

export abstract class PageSpyPlugin {
  public abstract name: string;

  /**
   * @description Specify the plugin ordering.
   * The plugin invocation will be in the following order:
   *   1. Plugins with `enforce: "pre"`;
   *   2. Plugins without enforce value;
   *   3. Plugins with `enforce: "post"`;
   */
  public abstract enforce?: PluginOrder;

  /**
   * @description Called after "new PageSpy()".
   */
  public abstract onInit: (params: OnInitParams) => any;

  /**
   * @description Called after PageSpy render done (if there have).
   */
  public abstract onMounted?: (params: OnMountedParams) => any;

  /**
   * @description Called once user don't need to PageSpy,
   * plugins should reset to the origin function.
   */
  public abstract onReset?: () => any;

  /**
   * @description Register action buttons in client popup panel, define the
   * button text and callback.
   */
  public abstract onActionSheet?: () => {
    text: string;
    action: () => void | Promise<void>;
  }[];
}

// prettier-ignore
export type PageSpyPluginLifecycle = keyof {
  [K in keyof PageSpyPlugin as K extends `on${string}`
    ? K
    : never
  ]: PageSpyPlugin[K];
};

export type PageSpyPluginLifecycleArgs<T extends PageSpyPluginLifecycle> =
  Parameters<NonNullable<PageSpyPlugin[T]>>;
