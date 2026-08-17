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
      clientOrigin: z
        .string()
        .refine((val) => val === '' || /^https?:\/\//i.test(val), {
          message: 'Invalid url',
        }),
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
       * Customize logo display type in float-ball.
       * - 'image': Display logo image (default)
       * - 'deviceId': Display device ID for easy identification
       * @default 'image'
       */
      logoType: z.enum(['image', 'deviceId']),
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

  protected schema = schema.superRefine((val, ctx) => {
    if (val.offline === false) {
      if (!val.api || !val.clientOrigin) {
        ctx.addIssue({
          code: 'custom',
          message: 'Must provide value when "offline" is false',
          path: [val.api ? 'clientOrigin' : 'api'],
        });
      }
    }
  });

  protected get platform() {
    const defaultConfig = {
      clientOrigin: '',
      autoRender: true,
      logo: logoUrl,
      logoType: 'image' as const,
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
        enableSSL: protocol !== 'http:',
      };
      return result;
    } catch (e) {
      return defaultConfig;
    }
  }
}
