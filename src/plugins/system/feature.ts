import { getObjectKeys, hasOwnProperty } from 'src/utils';
import type { SpySystem } from 'types';

export const FEATURE_MAP: SpySystem.Feature = {
  Element: {
    sandbox: {
      title: 'iframe/sandbox',
      keyPath: 'iframe/sandbox',
    },
    srcdoc: {
      title: 'iframe/srcdoc',
      keyPath: 'iframe/srcdoc',
    },
    apng: {
      title: 'img/apng',
      keyPath: 'img/apng',
    },
    avif: {
      title: 'img/avif',
      keyPath: 'img/avif',
    },
    imgcrossorigin: {
      title: 'img/crossorigin',
      keyPath: 'img/crossorigin',
    },
    exiforientation: {
      title: 'img/exif-orientation',
      keyPath: 'img/exif-orientation',
    },
    lazyloading: {
      title: 'img/lazyloading',
      keyPath: 'img/lazyloading',
    },
    webp: {
      title: 'img/webp',
      keyPath: 'img/webp',
    },
    prefetch: {
      title: 'link/prefetch',
      keyPath: 'link/prefetch',
    },
    scriptasync: {
      title: 'script/async',
      keyPath: 'script/async',
    },
    scriptdefer: {
      title: 'script/defer',
      keyPath: 'script/defer',
    },
  },
  Feature: {
    clipboard: {
      title: 'Clipboard',
      keyPath: 'clipboard',
    },
    customevent: {
      title: 'Custom Event',
      keyPath: 'event/customevent',
    },
    eventlistener: {
      title: 'Eventlistener',
      keyPath: 'event/eventlistener',
    },
    forcetouch: {
      title: 'Force Touch',
      keyPath: 'event/forcetouch',
    },
    hashchange: {
      title: 'Hash Change',
      keyPath: 'event/hashchange',
    },
    oninput: {
      title: 'Input Event',
      keyPath: 'event/oninput',
    },
    pointerevents: {
      title: 'Pointer Event',
      keyPath: 'event/forcetouch',
    },
    history: {
      title: 'History',
      keyPath: 'history',
    },
    messagechannel: {
      title: 'Message Channel',
      keyPath: 'messagechannel',
    },
    postmessage: {
      title: 'Postmessage',
      keyPath: 'postmessage',
    },
    performance: {
      title: 'Performance API',
      keyPath: 'performance',
    },
    queryselector: {
      title: 'queryselector',
      keyPath: 'queryselector',
    },
    requestanimationframe: {
      title: 'requestanimationframe',
      keyPath: 'requestanimationframe',
    },
    serviceworker: {
      title: 'Service Worker',
      keyPath: 'serviceworker',
    },
    webanimations: {
      title: 'Web Animation',
      keyPath: 'webanimations',
    },
    webgl: {
      title: 'WebGL',
      keyPath: 'webgl/webgl',
    },
    datachannel: {
      title: 'WebRTC/datachannel',
      keyPath: 'webrtc/datachannel',
    },
    getusermedia: {
      title: 'WebRTC/getusermedia',
      keyPath: 'webrtc/getusermedia',
    },
    peerconnection: {
      title: 'WebRTC/peerconnection',
      keyPath: 'webrtc/peerconnection',
    },
    resizeobserver: {
      title: 'Resizeobserver',
      keyPath: 'window/resizeobserver',
    },
    sharedworkers: {
      title: 'Shared Worker',
      keyPath: 'workers/sharedworkers',
    },
    webworkers: {
      title: 'Web Worker',
      keyPath: 'workers/webworkers',
    },
  },
  Network: {
    cors: {
      title: 'Cors',
      keyPath: 'cors',
    },
    beacon: {
      title: 'Beacon',
      keyPath: 'network/beacon',
    },
    fetch: {
      title: 'Fetch',
      keyPath: 'network/fetch',
    },
  },
  Javascript: {
    es6array: {
      title: 'ES6 Array',
      keyPath: 'es6/array',
    },
    arrow: {
      title: 'ES6 Arrow Function',
      keyPath: 'es6/arrow',
    },
    es6class: {
      title: 'ES6 Class',
      keyPath: 'es6/class',
    },
    es6collections: {
      title: 'ES6 Collections',
      keyPath: 'es6/collections',
    },
    generators: {
      title: 'ES6 Generators',
      keyPath: 'es6/generators',
    },
    es6math: {
      title: 'ES6 Math',
      keyPath: 'es6/math',
    },
    es6number: {
      title: 'ES6 Number',
      keyPath: 'es6/number',
    },
    es6object: {
      title: 'ES6 Object',
      keyPath: 'es6/object',
    },
    promises: {
      title: 'ES6 Promise',
      keyPath: 'es6/promises',
    },
    restparameters: {
      title: 'ES6 Rest Parameters',
      keyPath: 'es6/rest-parameters',
    },
    spreadarray: {
      title: 'ES6 Array Spread',
      keyPath: 'es6/spread-array',
    },
    stringtemplate: {
      title: 'ES6 String Template',
      keyPath: 'es6/string-template',
    },
    es6string: {
      title: 'ES6 String',
      keyPath: 'es6/string',
    },
    es6symbol: {
      title: 'ES6 Symbol',
      keyPath: 'es6/symbol',
    },
    proxy: {
      title: 'ES6 Proxy',
      keyPath: 'proxy',
    },
    reflect: {
      title: 'ES6 Reflect',
      customTest: `"Reflect" in window &&
      typeof window.Reflect === 'object' &&
      typeof Reflect.has === 'function' &&
      [
        'apply',
        'construct',
        'defineProperty',
        'deleteProperty',
        'getOwnPropertyDescriptor',
        'getPrototypeOf',
        'has',
        'isExtensible',
        'ownKeys',
        'preventExtensions',
        'setPrototypeOf',
      ].every((i) => Reflect.has(Reflect, i))`,
    },
    es7array: {
      title: 'ES7 Array',
      keyPath: 'es7/array',
    },
    restdestructuringarray: {
      title: 'ES7 Rest Destructuring',
      keyPath: 'es7/rest-destructuring',
    },
    spreadobject: {
      title: 'ES7 Object Spread',
      keyPath: 'es7/spread-object',
    },
    es8object: {
      title: 'ES8 Object',
      keyPath: 'es8/object',
    },
    finally: {
      title: 'ES9 Promise Finally',
      customTest: '<ES6 Promise> && !!Promise.prototype.finally',
    },
  },
  Storage: {
    cookies: {
      title: 'Cookies',
      keyPath: 'storage/cookies',
    },
    indexeddb: {
      title: 'IndexedDB',
      keyPath: 'storage/indexeddb',
    },
    localstorage: {
      title: 'LocalStorage',
      keyPath: 'storage/localstorage',
    },
    sessionstorage: {
      title: 'SessionStorage',
      keyPath: 'storage/sessionstorage',
    },
    websqldatabase: {
      title: 'Web SQL Database',
      keyPath: 'storage/websqldatabase',
    },
  },
};

const GITHUB_BASE_URL =
  'https://github.com/Modernizr/Modernizr/tree/master/feature-detects';

export const asyncFeatureKey = [
  'indexeddb',
  'apng',
  'avif',
  'exiforientation',
  'webp',
];

function computeAsyncFeature(key: string): Promise<boolean> {
  return new Promise((resolve) => {
    Modernizr.on(key, (result: boolean) => {
      resolve(result);
    });
  });
}

export async function computeResult() {
  const result: Record<SpySystem.Category, any[]> = {
    Element: [],
    Feature: [],
    Network: [],
    Javascript: [],
    Storage: [],
  };
  getObjectKeys(FEATURE_MAP).forEach((category) => {
    const features = FEATURE_MAP[category];
    const featureList = getObjectKeys(features).map(async (key) => {
      const value = features[key];
      if (value.keyPath) {
        value.keyPath = `${GITHUB_BASE_URL}/${value.keyPath}.js`;
      }
      if (asyncFeatureKey.indexOf(key) > -1) {
        value.supported = await computeAsyncFeature(key);
      } else {
        value.supported = Modernizr[key];
      }
      return value;
    });
    result[category] = featureList;
  });
  // eslint-disable-next-line no-restricted-syntax
  for (const category in result) {
    if (hasOwnProperty(result, category)) {
      // eslint-disable-next-line no-await-in-loop
      result[category as SpySystem.Category] = await Promise.all(
        result[category as SpySystem.Category],
      );
    }
  }
  return result;
}
