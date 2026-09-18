/* eslint-disable no-console */
import PageSpy from '@huolala-tech/page-spy-browser';
import './style.css';

type PageSpyConfig = ConstructorParameters<typeof PageSpy>[0];
type InputElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const SERVER_STORAGE_KEY = 'page-spy-browser-playground-config';
const REQUEST_ORIGIN = 'https://request.blucas.me';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Cannot find application root');

const storedConfig = JSON.parse(
  localStorage.getItem(SERVER_STORAGE_KEY) || '{}',
) as Record<string, string | boolean>;

app.innerHTML = `
  <main class="station-shell">
    <header class="masthead">
      <div>
        <p class="kicker">Browser SDK integration bench</p>
        <h1>PageSpy signal station</h1>
        <p class="lede">构建本仓库 SDK 后，在这里稳定复现浏览器侧日志、网络、缓存与异常场景。</p>
      </div>
      <div class="connection-indicator" id="connection-indicator" data-state="idle">
        <span class="signal-dot"></span>
        <span id="connection-label">尚未连接</span>
      </div>
    </header>

    <div class="workspace">
      <section class="configuration-panel">
        <div class="panel-heading">
          <div>
            <h2>连接与配置</h2>
            <p>每次连接都会使用当前表单初始化一个新的 SDK 实例。</p>
          </div>
          <button class="primary-button" id="connect-button">连接</button>
        </div>

        <form id="config-form" class="config-form">
          <section class="config-section">
            <h3>服务端</h3>
            <label>
              <span>服务端地址</span>
              <input id="server-url" type="url" value="${storedConfig.serverUrl || 'https://pagespy.jikejishu.com'}" spellcheck="false" />
            </label>
            <div class="derived-fields">
              <label>
                <span>api</span>
                <input id="api" readonly spellcheck="false" />
              </label>
              <label>
                <span>clientOrigin</span>
                <input id="client-origin" readonly spellcheck="false" />
              </label>
            </div>
            <label class="toggle-row">
              <input id="enable-ssl" type="checkbox" checked />
              <span>enableSSL</span>
            </label>
          </section>

          <details class="config-details">
            <summary>完整 SDK 配置 <span>可按需展开</span></summary>
            <div class="config-details-content">
          <section class="config-section">
            <h3>会话</h3>
            <label><span>project</span><input id="project" value="${storedConfig.project || 'browser-playground'}" /></label>
            <label><span>title</span><input id="title" value="${storedConfig.title || 'Local browser SDK'}" /></label>
            <label><span>messageCapacity</span><input id="message-capacity" type="number" min="1" value="${storedConfig.messageCapacity || '1000'}" /></label>
            <label class="toggle-row"><input id="use-secret" type="checkbox" /><span>useSecret</span></label>
            <label><span>secret</span><input value="由 SDK 在 useSecret 时生成" disabled /></label>
            <label class="toggle-row"><input id="offline" type="checkbox" /><span>offline</span></label>
            <label class="toggle-row"><input id="serialize-data" type="checkbox" /><span>serializeData</span></label>
          </section>

          <section class="config-section">
            <h3>界面与行为</h3>
            <label class="toggle-row"><input id="auto-render" type="checkbox" checked /><span>autoRender</span></label>
            <label><span>lang</span><select id="lang"><option value="zh">中文</option><option value="en">English</option></select></label>
            <label><span>disabledPlugins</span><input id="disabled-plugins" placeholder="例如 ConsolePlugin, NetworkPlugin" /></label>
            <label><span>gesture</span><input id="gesture" placeholder='例如 ["U","D","L","R"]' spellcheck="false" /></label>
            <label><span>primaryColor</span><input id="primary-color" value="#8f52ff" spellcheck="false" /></label>
            <label><span>dataProcessor</span><select id="processor-mode"><option value="none">不设置</option><option value="drop-network">过滤所有网络记录</option><option value="drop-console">过滤所有控制台记录</option></select></label>
          </section>
            </div>
          </details>
        </form>

        <div class="config-note">api 与 clientOrigin 会由服务端地址计算；secret 由 SDK 管理。dataProcessor 提供常用过滤预设，便于验证插件处理链路。</div>
      </section>

      <section class="scenario-area">
        <div class="scenario-header">
          <div>
            <p class="kicker">Plugin test bench</p>
            <h2>插件功能测试</h2>
          </div>
          <p id="activity-message" class="activity-message" aria-live="polite">准备就绪</p>
        </div>

        <div class="scenario-grid">
          <article class="scenario-card console-card">
            <div class="card-title"><span class="card-index">01</span><div><h3>ConsolePlugin</h3><p>验证日志等级及原始值、复杂对象、集合与特殊对象的序列化和展示。</p></div></div>
            <div class="button-group four-columns">
              <button data-console="log">console.log</button><button data-console="info">console.info</button><button data-console="warn">console.warn</button><button data-console="error">console.error</button>
            </div>
            <div class="button-group"><button id="log-data-types" class="quiet-button">输出多种数据类型</button></div>
            <button id="test-console-plugin" class="module-test-button">一键测试 ConsolePlugin</button>
          </article>

          <article class="scenario-card network-card">
            <div class="card-title"><span class="card-index">02</span><div><h3>NetworkPlugin</h3><p>覆盖 Fetch、XHR、sendBeacon、Fetch SSE 与数据接口；请求均发送到 <code>request.blucas.me</code>。</p></div></div>
            <div class="request-controls">
              <select id="request-method"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>
              <input id="status-code" type="number" min="100" max="599" value="200" aria-label="响应状态码" />
              <input id="status-message" value="signal-station" aria-label="响应消息" />
              <button id="send-status-request">Fetch 请求</button>
              <button id="send-xhr-request" class="quiet-button">XHR 请求</button>
              <button id="send-beacon-request" class="quiet-button">sendBeacon</button>
            </div>
            <div class="network-subsection">
              <div><h4>Fetch SSE</h4><p>以 fetch 建立 <code>/sse</code> 流，验证事件分帧与流式记录。</p></div>
              <div class="button-group"><button id="start-sse">开始 SSE 流</button><button id="stop-sse" class="quiet-button" disabled>停止 SSE 流</button></div>
            </div>
            <div class="network-subsection">
              <div><h4>数据接口</h4><p>请求 <code>/data</code>，可组合类型、延迟和单条 id。</p></div>
            <div class="request-controls data-controls">
              <select id="data-type"><option value="users">users</option><option value="posts">posts</option></select>
              <input id="data-delay" type="number" min="0" placeholder="延迟（秒）" aria-label="延迟秒数" />
              <input id="data-id" type="number" min="1" placeholder="id（可选）" aria-label="数据 id" />
              <button id="send-data-request">获取数据</button>
            </div>
            </div>
            <button id="test-network-plugin" class="module-test-button">一键测试 NetworkPlugin</button>
          </article>

          <article class="scenario-card storage-card">
            <div class="card-title"><span class="card-index">03</span><div><h3>StoragePlugin</h3><p>写入 localStorage、sessionStorage 与 Cookie。</p></div></div>
            <div class="button-group"><button id="write-storage">写入缓存</button><button id="clear-storage" class="quiet-button">清理测试缓存</button></div>
            <button id="test-storage-plugin" class="module-test-button">一键测试 StoragePlugin</button>
          </article>

          <article class="scenario-card database-card">
            <div class="card-title"><span class="card-index">04</span><div><h3>DatabasePlugin</h3><p>创建 IndexedDB 数据库并写入一条记录。</p></div></div>
            <div class="button-group"><button id="write-database">写入 IndexedDB</button><button id="clear-database" class="quiet-button">删除测试数据库</button></div>
            <button id="test-database-plugin" class="module-test-button">一键测试 DatabasePlugin</button>
          </article>

          <article class="scenario-card realtime-card">
            <div class="card-title"><span class="card-index">05</span><div><h3>EventSourcePlugin · WebSocketPlugin</h3><p>分别验证浏览器原生 EventSource 与 WebSocket 的消息记录。</p></div></div>
            <div class="button-group"><button id="start-eventsource">开始 EventSource</button><button id="stop-eventsource" class="quiet-button" disabled>停止 EventSource</button><button id="test-websocket" class="quiet-button">测试 WebSocket</button></div>
            <button id="test-realtime-plugins" class="module-test-button">一键测试实时连接插件</button>
          </article>

          <article class="scenario-card fault-card">
            <div class="card-title"><span class="card-index">06</span><div><h3>ErrorPlugin</h3><p>触发浏览器未捕获异常。</p></div></div>
            <div class="button-group"><button id="throw-error">抛出异步异常</button></div>
            <button id="test-error-plugin" class="module-test-button">一键测试 ErrorPlugin</button>
          </article>

          <article class="scenario-card page-card">
            <div class="card-title"><span class="card-index">07</span><div><h3>PagePlugin · SystemPlugin</h3><p>连接时采集系统信息；添加节点后可在调试端刷新页面快照。</p></div></div>
            <div class="button-group"><button id="add-dom-node" class="quiet-button">添加页面节点</button></div>
            <button id="test-page-plugin" class="module-test-button">一键测试 PagePlugin</button>
          </article>
        </div>
      </section>
    </div>
  </main>
`;

let pageSpy: InstanceType<typeof PageSpy> | null = null;
let sseController: AbortController | null = null;
let nativeEventSource: EventSource | null = null;

function element<T extends HTMLElement>(id: string) {
  const target = document.getElementById(id);
  if (!target) throw new Error(`Cannot find #${id}`);
  return target as T;
}

function value(id: string) {
  return element<InputElement>(id).value.trim();
}

function checked(id: string) {
  return element<HTMLInputElement>(id).checked;
}

function setActivity(message: string, isError = false) {
  const target = element<HTMLParagraphElement>('activity-message');
  target.textContent = message;
  target.dataset.state = isError ? 'error' : 'success';
}

function refreshDerivedServerFields() {
  const serviceUrl = value('server-url');
  try {
    const parsed = new URL(serviceUrl);
    element<HTMLInputElement>('api').value = parsed.host;
    element<HTMLInputElement>('client-origin').value = parsed.origin;
    element<HTMLInputElement>('enable-ssl').checked =
      parsed.protocol === 'https:';
    setActivity('服务端地址已更新，api 与 clientOrigin 已重新计算');
  } catch {
    element<HTMLInputElement>('api').value = '';
    element<HTMLInputElement>('client-origin').value = '';
    setActivity(
      '服务端地址必须是完整 URL，例如 https://pagespy.jikejishu.com',
      true,
    );
  }
}

function parseGesture() {
  const text = value('gesture');
  if (!text) return null;
  const gesture = JSON.parse(text);
  if (!Array.isArray(gesture)) throw new Error('gesture 必须是 JSON 数组');
  return gesture;
}

function getDataProcessor() {
  const mode = value('processor-mode');
  if (mode === 'drop-network') return { network: () => false };
  if (mode === 'drop-console') return { console: () => false };
  return {};
}

function getConfig(): PageSpyConfig {
  const api = value('api');
  const clientOrigin = value('client-origin');
  if (!api || !clientOrigin) throw new Error('请先填写合法的服务端地址');

  return {
    api,
    clientOrigin,
    project: value('project') || 'browser-playground',
    title: value('title') || 'Local browser SDK',
    autoRender: checked('auto-render'),
    enableSSL: checked('enable-ssl'),
    messageCapacity: Number(value('message-capacity')) || 1000,
    useSecret: checked('use-secret'),
    offline: checked('offline'),
    serializeData: checked('serialize-data'),
    disabledPlugins: value('disabled-plugins')
      .split(',')
      .map((plugin) => plugin.trim())
      .filter(Boolean),
    gesture: parseGesture(),
    primaryColor: value('primary-color') || undefined,
    lang: value('lang') === 'en' ? 'en' : 'zh',
    dataProcessor: getDataProcessor(),
  };
}

function persistForm() {
  localStorage.setItem(
    SERVER_STORAGE_KEY,
    JSON.stringify({
      serverUrl: value('server-url'),
      project: value('project'),
      title: value('title'),
      messageCapacity: value('message-capacity'),
    }),
  );
}

function connect() {
  try {
    persistForm();
    pageSpy?.abort();
    sessionStorage.removeItem('page-spy-room');
    pageSpy = new PageSpy(getConfig());
    element<HTMLElement>('connection-indicator').dataset.state = checked(
      'offline',
    )
      ? 'offline'
      : 'connecting';
    element<HTMLElement>('connection-label').textContent = checked('offline')
      ? '离线采集已初始化'
      : '正在创建调试房间';
    setActivity('SDK 已使用当前配置初始化。');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setActivity(message, true);
  }
}

function requestUrl(path: string) {
  return new URL(path, REQUEST_ORIGIN).toString();
}

function websocketUrl(path: string) {
  const url = new URL(path, REQUEST_ORIGIN);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}

async function executeRequest(url: string, init?: RequestInit) {
  try {
    const response = await fetch(url, init);
    const result = await response.text();
    setActivity(
      `${init?.method || 'GET'} ${response.status}: ${result.slice(0, 72)}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setActivity(`请求失败：${message}`, true);
  }
}

function writeIndexedDb() {
  const request = indexedDB.open('page-spy-signal-station', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('signals');
  request.onsuccess = () => {
    const database = request.result;
    database
      .transaction('signals', 'readwrite')
      .objectStore('signals')
      .put({ at: Date.now(), source: 'playground' }, 'latest');
    database.close();
  };
}

function deleteIndexedDb() {
  indexedDB.deleteDatabase('page-spy-signal-station');
}

function statusRequestUrl() {
  const status = value('status-code') || '200';
  const message = encodeURIComponent(
    value('status-message') || 'signal-station',
  );
  return requestUrl(`/status/${status}/${message}`);
}

function executeXhr() {
  const xhr = new XMLHttpRequest();
  const method = value('request-method');
  xhr.open(method, statusRequestUrl());
  xhr.onload = () =>
    setActivity(`XHR ${xhr.status}: ${xhr.responseText.slice(0, 72)}`);
  xhr.onerror = () => setActivity('XHR 请求失败', true);
  xhr.send(method === 'GET' ? null : JSON.stringify({ source: 'playground' }));
}

function sendBeacon() {
  const sent = navigator.sendBeacon(
    statusRequestUrl(),
    JSON.stringify({ source: 'page-spy-signal-station' }),
  );
  setActivity(sent ? 'sendBeacon 已入队' : 'sendBeacon 未能入队', !sent);
}

function click(id: string) {
  element<HTMLButtonElement>(id).click();
}

function writeConsoleLog(level: string) {
  const message = `PageSpy signal station ${level} at ${new Date().toISOString()}`;
  if (level === 'warn') {
    console.warn(message, { source: 'playground' });
  } else if (level === 'error') {
    console.error(message, { source: 'playground' });
  } else if (level === 'info') {
    console.info(message, { source: 'playground' });
  } else {
    console.log(message, { source: 'playground' });
  }
}

function writeConsoleDataTypes() {
  const circular: Record<string, unknown> = { name: 'circular' };
  circular.self = circular;

  console.log(
    '原始值',
    'PageSpy',
    42,
    true,
    false,
    null,
    undefined,
    NaN,
    Infinity,
    9007199254740993n,
    Symbol('signal'),
  );
  console.log(
    '对象与数组',
    { nested: { enabled: true, list: [1, 'two', { three: 3 }] } },
    [1, 2, 3],
    circular,
  );
  console.log(
    '集合与特殊对象',
    new Map<string, unknown>([
      ['room', 'signal-station'],
      ['count', 2],
    ]),
    new Set(['fetch', 'xhr']),
    new Date('2026-01-02T03:04:05.000Z'),
    /page-spy/gi,
    new Error('ConsolePlugin test error'),
  );
  console.log(
    '函数与二进制数据',
    function signalHandler() {},
    new Uint8Array([80, 97, 103, 101, 83, 112, 121]),
  );
}

element<HTMLInputElement>('server-url').addEventListener(
  'input',
  refreshDerivedServerFields,
);
element<HTMLButtonElement>('connect-button').addEventListener('click', connect);

document
  .querySelectorAll<HTMLButtonElement>('[data-console]')
  .forEach((button) => {
    button.addEventListener('click', () => {
      const level = button.dataset.console;
      writeConsoleLog(level || 'log');
      setActivity(`已写入 ${level} 日志`);
    });
  });

element<HTMLButtonElement>('test-console-plugin').addEventListener(
  'click',
  () => {
    ['log', 'info', 'warn', 'error'].forEach(writeConsoleLog);
    writeConsoleDataTypes();
    setActivity('ConsolePlugin 一键测试已发送日志等级与多种数据类型');
  },
);

element<HTMLButtonElement>('log-data-types').addEventListener('click', () => {
  writeConsoleDataTypes();
  setActivity('已输出多种数据类型');
});

element<HTMLButtonElement>('send-status-request').addEventListener(
  'click',
  () => {
    executeRequest(statusRequestUrl(), {
      method: value('request-method'),
    });
  },
);

element<HTMLButtonElement>('send-xhr-request').addEventListener(
  'click',
  executeXhr,
);
element<HTMLButtonElement>('send-beacon-request').addEventListener(
  'click',
  sendBeacon,
);

element<HTMLButtonElement>('send-data-request').addEventListener(
  'click',
  () => {
    const params = new URLSearchParams({ type: value('data-type') || 'users' });
    const delay = value('data-delay');
    const id = value('data-id');
    if (delay) params.set('delay', delay);
    if (id) params.set('id', id);
    executeRequest(requestUrl(`/data?${params.toString()}`));
  },
);

element<HTMLButtonElement>('start-sse').addEventListener('click', () => {
  sseController?.abort();
  sseController = new AbortController();
  element<HTMLButtonElement>('start-sse').disabled = true;
  element<HTMLButtonElement>('stop-sse').disabled = false;
  fetch(requestUrl('/sse'), { signal: sseController.signal })
    .then((response) => setActivity(`SSE 已建立，HTTP ${response.status}`))
    .catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setActivity(
        `SSE 失败：${error instanceof Error ? error.message : String(error)}`,
        true,
      );
    });
});

element<HTMLButtonElement>('stop-sse').addEventListener('click', () => {
  sseController?.abort();
  sseController = null;
  element<HTMLButtonElement>('start-sse').disabled = false;
  element<HTMLButtonElement>('stop-sse').disabled = true;
  setActivity('SSE 流已停止');
});

element<HTMLButtonElement>('test-network-plugin').addEventListener(
  'click',
  () => {
    [
      'send-status-request',
      'send-xhr-request',
      'send-beacon-request',
      'send-data-request',
      'start-sse',
    ].forEach(click);
    setActivity(
      'NetworkPlugin 一键测试已发起 Fetch、XHR、Beacon、数据请求与 SSE',
    );
  },
);

element<HTMLButtonElement>('start-eventsource').addEventListener(
  'click',
  () => {
    nativeEventSource?.close();
    nativeEventSource = new EventSource(requestUrl('/sse'));
    nativeEventSource.addEventListener('open', () =>
      setActivity('EventSource 已建立'),
    );
    nativeEventSource.addEventListener('error', () =>
      setActivity('EventSource 连接异常或已关闭', true),
    );
    element<HTMLButtonElement>('start-eventsource').disabled = true;
    element<HTMLButtonElement>('stop-eventsource').disabled = false;
  },
);

element<HTMLButtonElement>('stop-eventsource').addEventListener('click', () => {
  nativeEventSource?.close();
  nativeEventSource = null;
  element<HTMLButtonElement>('start-eventsource').disabled = false;
  element<HTMLButtonElement>('stop-eventsource').disabled = true;
  setActivity('EventSource 已停止');
});

element<HTMLButtonElement>('test-websocket').addEventListener('click', () => {
  const socket = new WebSocket(websocketUrl('/ws'));
  const totalMessages = 5;
  let sentMessages = 0;
  let receivedMessages = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const stopSending = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  socket.addEventListener('open', () => {
    timer = setInterval(() => {
      sentMessages += 1;
      socket.send(`PageSpy signal station message ${sentMessages}`);
      if (sentMessages === totalMessages) stopSending();
    }, 500);
    setActivity(`WebSocket 已连接，将定时发送 ${totalMessages} 条测试消息`);
  });
  socket.addEventListener('error', () => {
    stopSending();
    setActivity('WebSocket 连接失败', true);
  });
  socket.addEventListener('message', () => {
    receivedMessages += 1;
    if (receivedMessages === totalMessages) {
      socket.close();
      setActivity(`WebSocket 已收到 ${receivedMessages} 条回显消息并关闭连接`);
    }
  });
  socket.addEventListener('close', stopSending);
});

element<HTMLButtonElement>('test-realtime-plugins').addEventListener(
  'click',
  () => {
    click('start-eventsource');
    click('test-websocket');
  },
);

element<HTMLButtonElement>('write-storage').addEventListener('click', () => {
  const timestamp = new Date().toISOString();
  localStorage.setItem('page-spy-signal-local', timestamp);
  sessionStorage.setItem('page-spy-signal-session', timestamp);
  document.cookie = `page-spy-signal=${Date.now()}; path=/; SameSite=Lax`;
  writeIndexedDb();
  setActivity('已写入 localStorage、sessionStorage、Cookie 和 IndexedDB');
});

element<HTMLButtonElement>('clear-storage').addEventListener('click', () => {
  localStorage.removeItem('page-spy-signal-local');
  sessionStorage.removeItem('page-spy-signal-session');
  document.cookie = 'page-spy-signal=; Max-Age=0; path=/; SameSite=Lax';
  deleteIndexedDb();
  setActivity('已清理测试缓存');
});

element<HTMLButtonElement>('test-storage-plugin').addEventListener(
  'click',
  () => click('write-storage'),
);

element<HTMLButtonElement>('write-database').addEventListener('click', () => {
  writeIndexedDb();
  setActivity('IndexedDB 测试记录已写入');
});
element<HTMLButtonElement>('clear-database').addEventListener('click', () => {
  deleteIndexedDb();
  setActivity('IndexedDB 测试数据库已删除');
});
element<HTMLButtonElement>('test-database-plugin').addEventListener(
  'click',
  () => click('write-database'),
);

element<HTMLButtonElement>('throw-error').addEventListener('click', () => {
  setActivity('将在下一轮事件循环抛出测试异常');
  setTimeout(() => {
    throw new Error('PageSpy signal station test error');
  });
});

element<HTMLButtonElement>('test-error-plugin').addEventListener('click', () =>
  click('throw-error'),
);

element<HTMLButtonElement>('add-dom-node').addEventListener('click', () => {
  const node = document.createElement('div');
  node.className = 'signal-node';
  node.textContent = `Signal node ${new Date().toLocaleTimeString()}`;
  app.append(node);
  setActivity('已添加页面测试节点');
});

element<HTMLButtonElement>('test-page-plugin').addEventListener('click', () =>
  click('add-dom-node'),
);

refreshDerivedServerFields();
