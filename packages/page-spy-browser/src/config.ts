import {
  ConfigBase,
  extendConfigSchema,
  SchemaUnwrap,
} from '@huolala-tech/page-spy-base';
import logoUrl from './assets/logo.svg';
import modalLogoUrl from './assets/modal-logo.svg';

export const nodeId = '__pageSpy';

const schema = extendConfigSchema((z) => ({
  /**
   * Client host. Form example, "https://example.com".
   */
  clientOrigin: z.string().optional(),
  /**
   * Indicate whether auto render the widget on the bottom-left corner.
   * You can manually render later by calling "window.$pageSpy.render()"
   * if passed false.
   * @default true
   */
  autoRender: z.boolean().optional(),
  /**
   * Indicate whether enable offline mode. Once enabled, PageSpy will not
   * make network requests and send data by server. Collected data can be
   * exported with "DataHarborPlugin" and then replayed in the debugger.
   */
  offline: z.boolean().optional(),
  /**
   * Customize logo source url in float-ball.
   */
  logo: z.string().optional(),
  /**
   * Customize brand primary color.
   */
  primaryColor: z.string().optional(),
  /**
   * Customize modal.
   */
  modal: z
    .object({
      /**
       * Customize logo source url in modal.
       */
      logo: z.string().optional(),
      /**
       * Customize modal title.
       */
      title: z.string().optional(),
    })
    .optional(),
  /**
   * Dynamic enable PageSpy by gesture.
   * The size of `Command` must be at least 4.
   */
  gesture: z
    .array(
      z.union([z.literal('U'), z.literal('D'), z.literal('L'), z.literal('R')]),
    )
    .min(4)
    .optional(),
  /**
   * Specify language
   */
  lang: z.enum(['en', 'zh']).optional(),
}));

export type InitConfig = SchemaUnwrap<typeof schema>;

export class Config extends ConfigBase<InitConfig> {
  /**
   * NOTE: the 'scriptLink' must be mark static, for
   * "document.currentScript.src" only valid after <script> load done.
   */
  public static scriptLink = (document.currentScript as HTMLScriptElement)?.src;

  protected schema = schema;

  protected get platform() {
    const defaultConfig = {
      secret: '',
      clientOrigin: '',
      autoRender: true,
      logo: logoUrl,
      primaryColor: 'hsl(270, 100%, 55%)',
      modal: {
        logo: modalLogoUrl,
        title: 'PageSpy',
      },
      gesture: [],
      lang: 'zh' as const,
    };

    if (!Config.scriptLink) {
      return defaultConfig;
    }

    try {
      const { host, origin, protocol } = new URL(Config.scriptLink);
      const result = {
        ...defaultConfig,
        api: host,
        clientOrigin: origin,
        enableSSL: protocol.startsWith('https'),
      };
      return result;
    } catch (e) {
      return defaultConfig;
    }
  }
}
