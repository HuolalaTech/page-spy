import type { Client } from '@huolala-tech/page-spy-types';
import { getRandomId, isURL } from '@huolala-tech/page-spy-base';
import { Config, InitConfig } from '../config';
import { getGlobal, joinQuery } from '../utils';

interface TResponse<T> {
  code: string;
  data: T;
  success: boolean;
  message: string;
}

interface TCreateRoom {
  // TODO: 这里的 name 当前承载浏览器和系统信息，后续可考虑拆成更明确字段。
  name: string;
  address: string;
  password: string;
  group: string;
  tags: Record<string, any>;
}

/** 根据配置选择 HTTP 与 WebSocket 协议头。 */
const getScheme = (enableSSL: InitConfig['enableSSL']) => {
  return enableSSL === false ? ['http://', 'ws://'] : ['https://', 'wss://'];
};

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

type NativeModuleFetch = (data: {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}) => Promise<{
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
}>;

type NativeModuleFetchModule = {
  fetch: NativeModuleFetch;
};

/** 将 HeadersInit 统一转换为普通对象，便于传给 NativeModules。 */
const headersToRecord = (headers?: HeadersInit): Record<string, string> => {
  if (!headers) return {};

  if (typeof Headers === 'function' && headers instanceof Headers) {
    return [...headers.entries()].reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  if (Array.isArray(headers)) {
    return headers.reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  return headers as Record<string, string>;
};

/** 从 fetch 入参中提取 URL 字符串，兼容 string、URL 和 Request-like 对象。 */
const getInputUrl = (input: RequestInfo | URL) => {
  if (typeof input === 'string') return input;
  if (isURL(input)) return input.toString();
  return (input as { url: string }).url;
};

/** 从 fetch 入参中提取请求方法，默认 GET。 */
const getInputMethod = (input: RequestInfo | URL, init?: RequestInit) => {
  if (init?.method) return init.method;
  if (typeof input === 'object' && 'method' in input && input.method) {
    return input.method;
  }
  return 'GET';
};

/** 从 fetch 入参中提取请求头，优先使用 init.headers。 */
const getInputHeaders = (input: RequestInfo | URL, init?: RequestInit) => {
  if (init?.headers) return headersToRecord(init.headers);
  if (typeof input === 'object' && 'headers' in input) {
    return headersToRecord(input.headers);
  }
  return {};
};

/** 将原生 FetchModule 返回值包装成近似标准 Response 的对象。 */
const createNativeModuleResponse = (raw: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
}) => {
  if (raw.error) {
    throw Error(raw.error);
  }
  const body = raw.body || '';
  const responseHeaders = raw.headers || {};
  return {
    ok: raw.ok ?? true,
    status: raw.status ?? 200,
    statusText: raw.statusText || '',
    headers: {
      get: (key: string) => responseHeaders[key.toLowerCase()] ?? null,
      entries: () => Object.entries(responseHeaders),
    },
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body)),
  } as unknown as Response;
};

/** 判断当前是否为需要优先走 lynx.fetch 的原生 Lynx 平台。 */
const isNativeLynxPlatform = (globalObject: Record<string, any>) => {
  const platform = String(
    globalObject.SystemInfo?.platform ||
      globalObject.lynx?.__globalProps?.platform ||
      '',
  ).toLowerCase();

  return ['android', 'ios', 'harmony'].includes(platform);
};

/** 包装 lynx.fetch，补齐部分平台需要 Request 实例作为入参的行为。 */
const createLynxFetch = (
  globalObject: Record<string, any>,
  lynxFetch: FetchLike,
): FetchLike => {
  return (input, init) => {
    const RequestCtor = globalObject.Request || globalThis.Request;
    if (typeof RequestCtor === 'function' && !(input instanceof RequestCtor)) {
      return lynxFetch.call(globalObject.lynx, new RequestCtor(input, init));
    }
    return lynxFetch.call(globalObject.lynx, input, init);
  };
};

/** 将 NativeModules.FetchModule 适配成 fetch 风格函数。 */
const createNativeModuleFetch = (
  nativeModule: NativeModuleFetchModule,
): FetchLike => {
  return async (input, init) => {
    const raw = await nativeModule.fetch.call(nativeModule, {
      url: getInputUrl(input),
      method: getInputMethod(input, init),
      headers: getInputHeaders(input, init),
      body: typeof init?.body === 'string' ? init.body : undefined,
    });
    return createNativeModuleResponse(raw);
  };
};

/** 按 Lynx 原生能力、NativeModule、全局 fetch 的优先级获取可用请求函数。 */
const getRuntimeFetch = (): FetchLike => {
  const globalObject = getGlobal();
  const lynxFetch = globalObject.lynx?.fetch;
  const nativeModuleFetchModule = globalObject.NativeModules?.FetchModule;

  if (isNativeLynxPlatform(globalObject) && typeof lynxFetch === 'function') {
    return createLynxFetch(globalObject, lynxFetch);
  }

  if (typeof nativeModuleFetchModule?.fetch === 'function') {
    return createNativeModuleFetch(nativeModuleFetchModule);
  }

  const globalFetch = globalObject.fetch;
  if (typeof globalFetch === 'function') {
    return globalFetch.bind(globalObject);
  }

  if (typeof lynxFetch === 'function') {
    return createLynxFetch(globalObject, lynxFetch);
  }

  throw Error('fetch is not available in current Lynx runtime');
};

/** PageSpy 后端 API 封装，负责创建调试房间和拼接房间 WebSocket 地址。 */
export default class Request {
  constructor(
    public config: Config,
    public client: Client,
  ) {
    if (!config.get().api) {
      throw Error('The api base url cannot be empty');
    }
  }

  get base() {
    return this.config.get().api;
  }

  /** 当前实例使用的 HTTP/WS 协议头。 */
  getScheme() {
    return this.config.get().enableSSL
      ? ['https://', 'wss://']
      : ['http://', 'ws://'];
  }

  /** 创建调试房间并返回房间名、房间号和 WebSocket 地址。 */
  createRoom() {
    const config = this.config.get();
    const scheme = getScheme(config.enableSSL);
    const name = this.client.getName();
    console.log('Creating room with name:', name);
    const query = joinQuery({
      name: encodeURIComponent(name),
      group: config.project,
      title: config.title,
    });

    return getRuntimeFetch()(
      `${scheme[0]}${this.base}/api/v1/room/create?${query}`,
      {
        method: 'POST',
      },
    )
      .then((res) => res.json())
      .then((res: TResponse<TCreateRoom>) => {
        // eslint-disable-next-line @typescript-eslint/no-shadow
        const { name, address } = res.data || {};
        const roomUrl = this.getRoomUrl(address);
        return {
          roomUrl,
          address,
          name,
        };
      })
      .catch((err) => {
        /* c8 ignore next */
        throw Error(`Request create room failed: ${err.message}`);
      });
  }

  /** 拼接客户端加入房间的 WebSocket URL。 */
  getRoomUrl(address: string) {
    const scheme = this.getScheme();
    const { useSecret, secret } = this.config.get();
    return `${scheme[1]}${this.base}/api/v1/ws/room/join?${joinQuery({
      address,
      name: `client:${getRandomId()}`,
      userId: 'Client',
      forceCreate: true,
      useSecret,
      secret,
    })}`;
  }
}
