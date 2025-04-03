import {
  ConfigBase,
  extendConfigSchema,
  SchemaUnwrap,
} from '@huolala-tech/page-spy-base';
import logoUrl from './assets/logo.svg';
import modalLogoUrl from './assets/modal-logo.svg';

export const nodeId = '__pageSpy';

const schema = extendConfigSchema((z) => {
  return z
    .object({
      /**
       * Client host. Form example, "https://example.com".
       */
      clientOrigin: z.string().url(),
      /**
       * Indicate whether auto render the widget on the bottom-left corner.
       * You can manually render later by calling "window.$pageSpy.render()"
       * if passed false.
       * @default true
       */
      autoRender: z.boolean(),
      /**
       * Customize logo source url in float-ball.
       */
      logo: z.string(),
      /**
       * Customize brand primary color.
       */
      primaryColor: z.string(),
      /**
       * Customize modal.
       */
      modal: z
        .object({
          /**
           * Customize logo source url in modal.
           */
          logo: z.string(),
          /**
           * Customize modal title.
           */
          title: z.string(),
        })
        .partial()
        .strict(),
      /**
       * Dynamic enable PageSpy by gesture.
       * The size of `Command` must be at least 4.
       */
      gesture: z.nullable(
        z
          .array(
            z.union([
              z.literal('U'),
              z.literal('D'),
              z.literal('L'),
              z.literal('R'),
            ]),
          )
          .min(4),
      ),
      /**
       * Specify language
       */
      lang: z.enum(['zh', 'en']),
    })
    .partial()
    .strict();
});

export type InitConfig = SchemaUnwrap<typeof schema>;

export class Config extends ConfigBase<InitConfig> {
  /**
   * NOTE: the 'scriptLink' must be mark static, for
   * "document.currentScript.src" only valid after <script> load done.
   */
  public static scriptLink = (document.currentScript as HTMLScriptElement)?.src;

  protected schema = schema.refine(
    (val) => {
      return val.offline === false && val.api?.length;
    },
    {
      message: 'Must provide "api" when "offline" is false',
      path: ['api'],
    },
  );

  protected get platform() {
    const defaultConfig = {
      clientOrigin: '',
      autoRender: true,
      logo: logoUrl,
      primaryColor: 'hsl(270, 100%, 55%)',
      modal: {
        logo: modalLogoUrl,
        title: 'PageSpy',
      },
      gesture: null,
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
