import { z, ZodError } from 'zod';
import { DataItem as ConsoleData } from '@huolala-tech/page-spy-types/lib/console';
import { DataItem as StorageData } from '@huolala-tech/page-spy-types/lib/storage';
import { DataItem as PageData } from '@huolala-tech/page-spy-types/lib/page';
import { DataItem as DatabaseData } from '@huolala-tech/page-spy-types/lib/database';
import { DataItem as SystemData } from '@huolala-tech/page-spy-types/lib/system';
import { RequestInfo } from '@huolala-tech/page-spy-types/lib/network';

export type SchemaUnwrap<T extends z.ZodType> = z.infer<T>;

const processorFn = <T>() =>
  z.function().args(z.custom<T>()).returns(z.boolean().optional());

const baseSchema = z
  .object({
    /**
     * The server base url. For example, "example.com".
     * - Create room: `https://${api}/room/create`
     * - Filter room: `https://${api}/room/list`
     * - Join WebSocket room: `wss://${api}/ws/room/join`
     */
    api: z.string().refine((val) => !val.startsWith('http'), {
      message: 'Just need host part in url',
    }),

    /**
     * Project name, used for group connections
     */
    project: z.string().min(1, 'Missing value'),

    /**
     * Custom title for displaying some data like user info to
     * help you to distinguish the client. The title value will
     * show in the room-list route page.
     */
    title: z.string().min(1, 'Missing value'),

    /**
     * Specify the server <scheme> manually.
     * - false: sdk will use ['http://', 'ws://'];
     * - true: sdk will use ['https://', 'wss://'];
     */
    enableSSL: z.boolean(),

    /**
     * Specify how many messages to cache.
     * The data is primarily used for define "socketStore.messageCapacity" to
     * configure the maximum number of historical data the SDK can send
     * after the debugging terminal goes online.
     */
    messageCapacity: z.number(),

    /**
     * Indicate whether authorization is required. If enabled, PageSpy generates
     * a 6-digit random number (below "secret") as a password for the debug room,
     * which is required for developers to access the debug room
     * @default false
     */
    useSecret: z.boolean(),
    secret: z.string().refine((val) => !val, {
      message: 'Secret is not allowed to be set manually',
    }),

    /**
     * Indicate whether enable offline mode. Once enabled, PageSpy will not
     * make network requests and send data by server. Collected data can be
     * exported with "DataHarborPlugin" and then replayed in the debugger.
     */
    offline: z.boolean(),
    /**
     * Indicate whether serialize non-primitive data in offline log.
     */
    serializeData: z.boolean(),

    /**
     * Internal plugins is out-of-box carried with PageSpy.
     * You can disable plugin by passing the plugin name to this option.
     */
    disabledPlugins: z.array(z.string()),

    /**
     * Specify data processor for each data type.
     */
    dataProcessor: z
      .object({
        console: processorFn<ConsoleData>(),
        network: processorFn<RequestInfo>(),
        storage: processorFn<StorageData>(),
        database: processorFn<DatabaseData>(),
        page: processorFn<PageData>(),
        system: processorFn<SystemData>(),
      })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

export type InitConfigBase = z.infer<typeof baseSchema>;

export const extendConfigSchema = <T extends z.AnyZodObject>(
  extendFn: (_z: typeof z) => T,
) => {
  return baseSchema.merge(extendFn(z));
};

class InvalidConfigError extends Error {
  constructor(error: ZodError, config: Record<string, any>) {
    const message = error.issues
      .map((issue) => {
        if (issue.code === 'unrecognized_keys') {
          return `- ${issue.message};`;
        }
        return `- ${issue.path.join('.')}: ${issue.message};`;
      })
      .join('\n');

    let output = `config values validation failed.

${message}`;
    try {
      output = `${output}
      
Current config: ${JSON.stringify(config, null, 2)}`;
    } catch (e) {
      //
    }
    super(output);
    this.name = 'InvalidConfigError';
  }
}

export abstract class ConfigBase<C extends InitConfigBase> {
  protected abstract schema: z.ZodSchema<C>;

  protected abstract platform: C;

  protected get base(): InitConfigBase {
    return {
      api: '',
      project: '--',
      title: '--',
      enableSSL: true,
      messageCapacity: 1000,
      useSecret: false,
      secret: '', // secret is private and would generated automatically when enable "useSecret: true"
      offline: false,
      serializeData: false,
      disabledPlugins: [],
      dataProcessor: {},
    };
  }

  protected value: Required<C> = {
    ...this.base,
  } as Required<C>;

  public mergeConfig = (userCfg: Record<string, any>): Required<C> => {
    const value = {
      ...this.base,
      ...this.platform,
      ...userCfg,
    };
    try {
      this.schema.parse(value);
    } catch (error) {
      throw new InvalidConfigError(error as ZodError, value);
    }
    this.value = value as Required<C>;
    return this.value;
  };

  get() {
    return this.value;
  }

  set<T extends keyof C>(key: T, val: C[T]) {
    this.value[key] = val;
  }
}
