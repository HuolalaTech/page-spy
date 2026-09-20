/* eslint-disable no-restricted-syntax */
import { SpyClient } from '@huolala-tech/page-spy-types';

/**
 * Client information manager for PageSpy SDK.
 *
 * Collects and formats client environment information (OS, browser, framework, etc.)
 * to be sent to the debugging server.
 *
 * Implements the `SpyClient.Client` contract from page-spy-types so plugins
 * only need to depend on the types package.
 */
export class Client implements SpyClient.Client {
  /**
   * Creates a new Client instance.
   *
   * @param info - Parsed client information (OS type/version, browser type/version, framework, etc.)
   * @param rawInfo - Raw system information from platform-specific APIs (e.g., wx.getSystemInfoSync).
   *                  This will be sent by the system plugin for detailed diagnostics.
   */
  constructor(
    public info: SpyClient.ClientInfo = {
      // Platform-specific packages should override browserType and framework
      osType: 'unknown',
      osVersion: 'unknown',
      browserType: 'unknown',
      browserVersion: 'unknown',
      framework: 'unknown',
      isDevTools: false,
      sdk: 'unknown',
      sdkVersion: '0.0.0',
    },
    public rawInfo?: Record<string, any>,
  ) {}

  /** List of registered plugin names */
  plugins: string[] = [];

  /**
   * Creates a client information message to be sent to the debugging server.
   *
   * @returns Client data item containing SDK info, plugin list, and user agent string
   */
  makeClientInfoMsg() {
    const msg: SpyClient.DataItem = {
      sdk: this.info.sdk,
      isDevTools: this.info.isDevTools,
      ua: this.getName(),
      plugins: this.plugins,
    };
    return msg;
  }

  /** Cached user agent string */
  private _name: string = '';

  /**
   * Gets the user agent string for this client.
   *
   * Constructs a UA string in the format: "osType/osVersion browserType/browserVersion"
   * or uses the provided ua field if available. The result is cached after first call.
   *
   * @returns User agent string identifying the client environment
   *
   * @example
   * ```typescript
   * // Returns: "iOS/15.0 Safari/15.0"
   * client.getName();
   * ```
   */
  getName() {
    if (!this._name) {
      const { ua, osType, osVersion, browserType, browserVersion } = this.info;

      this._name =
        ua || `${osType}/${osVersion} ${browserType}/${browserVersion}`;
    }
    return this._name;
  }
}
