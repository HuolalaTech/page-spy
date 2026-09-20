import { z, ZodError } from 'zod';
import type { InitConfigBase } from '@huolala-tech/page-spy-types';
import { DataItem as ConsoleData } from '@huolala-tech/page-spy-types/lib/console';
import { DataItem as StorageData } from '@huolala-tech/page-spy-types/lib/storage';
import { DataItem as PageData } from '@huolala-tech/page-spy-types/lib/page';
import { DataItem as DatabaseData } from '@huolala-tech/page-spy-types/lib/database';
import { DataItem as SystemData } from '@huolala-tech/page-spy-types/lib/system';
import { RequestInfo } from '@huolala-tech/page-spy-types/lib/network';

/**
 * Helper type to unwrap the TypeScript type from a Zod schema.
 */
export type SchemaUnwrap<T extends z.ZodType> = z.infer<T>;

/**
 * Creates a Zod schema validator for data processor functions.
 *
 * Data processors are optional filters that can inspect and potentially
 * drop data items before they are sent to the server. Return false to drop the item.
 *
 * @returns Zod schema for a processor function: (data: T) => boolean | void
 */
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

/**
 * Base configuration type for PageSpy initialization.
 *
 * The type contract is defined in `page-spy-types` so plugin authors don't
 * need to depend on this package. It is re-exported here for backward
 * compatibility. The zod schema below is the runtime validation of the same
 * shape; a compile-time assertion keeps both in sync.
 */
export type { InitConfigBase };

// Drift check: the zod-inferred shape and the contract must stay mutually
// assignable in both directions. Adding/removing a field or changing a
// field's type on either side breaks one of the constraints and fails
// compilation.
//
// Two normalization steps are required:
// 1. zod infers optional properties as `x?: T | undefined` while the contract
//    uses `x?: T`. `Normalize` strips the optional modifier and `undefined`
//    from both sides so the two notations compare equal.
// 2. After normalization every property is required, so an extra or missing
//    field on either side breaks assignability in one direction. Plain
//    (un-normalized) assignability would silently allow extra optional fields.
type AssertTrue<T extends true> = T;
type Normalize<T> = { [K in keyof T]-?: Exclude<T[K], undefined> };
type Schema = Normalize<z.infer<typeof baseSchema>>;
type Contract = Normalize<InitConfigBase>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _schemaMatchesContract = AssertTrue<
  [Schema] extends [Contract] ? true : false
>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _contractMatchesSchema = AssertTrue<
  [Contract] extends [Schema] ? true : false
>;

/**
 * Extends the base configuration schema with platform-specific fields.
 *
 * @param extendFn - Function that receives Zod and returns additional schema fields
 * @returns Merged schema combining base and platform-specific options
 *
 * @example
 * ```typescript
 * const browserSchema = extendConfigSchema((z) =>
 *   z.object({
 *     autoRender: z.boolean(),
 *     logo: z.string().optional(),
 *   })
 * );
 * ```
 */
export const extendConfigSchema = <T extends z.AnyZodObject>(
  extendFn: (_z: typeof z) => T,
) => {
  return baseSchema.merge(extendFn(z));
};

/**
 * Custom error thrown when configuration validation fails.
 *
 * Provides detailed error messages showing which fields failed validation
 * and includes the full config object for debugging.
 */
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

/**
 * Abstract base class for PageSpy configuration management.
 *
 * Platform-specific packages should extend this class and provide:
 * - A Zod schema for validation (via `schema` property)
 * - Default platform-specific config values (via `platform` property)
 *
 * @template C - The configuration type (extends InitConfigBase)
 */
export abstract class ConfigBase<C extends InitConfigBase> {
  /** Zod schema for validating the merged configuration */
  protected abstract schema: z.ZodSchema<C>;

  /** Platform-specific default configuration values */
  protected abstract platform: C;

  /** Base configuration values shared across all platforms */
  protected get base(): InitConfigBase {
    return {
      api: '',
      project: '--',
      title: '--',
      enableSSL: true,
      messageCapacity: 1000,
      useSecret: false,
      secret: '', // Generated automatically when useSecret is true
      offline: false,
      serializeData: false,
      disabledPlugins: [],
      dataProcessor: {},
    };
  }

  /** Current merged configuration value */
  protected value: Required<C> = {
    ...this.base,
  } as Required<C>;

  /**
   * Merges user-provided configuration with base and platform defaults.
   *
   * Configuration priority (highest to lowest):
   * 1. User-provided config
   * 2. Platform defaults
   * 3. Base defaults
   *
   * @param userCfg - User-provided configuration object
   * @returns The fully merged and validated configuration
   * @throws {InvalidConfigError} If validation fails
   */
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

  /**
   * Gets the current configuration value.
   *
   * @returns The current merged configuration
   */
  get() {
    return this.value;
  }

  /**
   * Updates a single configuration field.
   *
   * @param key - Configuration field name
   * @param val - New value for the field
   */
  set<T extends keyof C>(key: T, val: C[T]) {
    this.value[key] = val;
  }
}
