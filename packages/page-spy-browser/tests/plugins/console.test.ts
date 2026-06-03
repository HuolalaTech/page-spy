import { atom } from 'page-spy-base/dist/atom';
import { ConsoleExportMode } from 'page-spy-base/src/config';
import { Config, InitConfig } from 'page-spy-browser/src/config';
import socket from 'page-spy-browser/src/helpers/socket';
import ConsolePlugin from 'page-spy-browser/src/plugins/console';

const createPlugin = (config: InitConfig) => {
  const plugin = new ConsolePlugin();
  plugin.$pageSpyConfig = new Config().mergeConfig({
    api: 'example.com',
    clientOrigin: 'https://example.com',
    ...config,
  });
  plugin.console = {
    log: jest.fn(),
  };
  return plugin;
};

afterEach(() => {
  jest.restoreAllMocks();
  atom.resetStore();
  atom.resetInstanceStore();
});

describe('Console plugin export mode', () => {
  it('Keeps atom previews in original mode', () => {
    const broadcast = jest
      .spyOn(socket, 'broadcastMessage')
      .mockImplementation(jest.fn());
    jest.spyOn(socket, 'dispatchEvent').mockImplementation(jest.fn());
    const plugin = createPlugin({});

    plugin.printLog({
      logType: 'log',
      logs: [{ a: 1 }],
      url: 'https://example.com',
    });

    const message = broadcast.mock.calls[0][0] as any;
    expect(message.data.logs[0].type).toBe('atom');
  });

  it('Sends JSON snapshots in complete mode', () => {
    const broadcast = jest
      .spyOn(socket, 'broadcastMessage')
      .mockImplementation(jest.fn());
    jest.spyOn(socket, 'dispatchEvent').mockImplementation(jest.fn());
    const plugin = createPlugin({
      consoleExportMode: ConsoleExportMode.Complete,
    });

    plugin.printLog({
      logType: 'log',
      logs: [[{ a: 1 }, { a: 2 }]],
      url: 'https://example.com',
    });

    const message = broadcast.mock.calls[0][0] as any;
    expect(message.data.logs[0].type).toBe('json');
    expect(JSON.parse(message.data.logs[0].value)).toEqual([
      { a: 1 },
      { a: 2 },
    ]);
  });

  it('Falls back to atom previews for incomplete complete-mode snapshots', () => {
    const broadcast = jest
      .spyOn(socket, 'broadcastMessage')
      .mockImplementation(jest.fn());
    jest.spyOn(socket, 'dispatchEvent').mockImplementation(jest.fn());
    const plugin = createPlugin({
      consoleExportMode: ConsoleExportMode.Complete,
    });

    plugin.printLog({
      logType: 'log',
      logs: [document.body],
      url: 'https://example.com',
    });

    const message = broadcast.mock.calls[0][0] as any;
    expect(message.data.logs[0].type).toBe('atom');
    expect(message.data.logs[0].value).toBe('HTMLBodyElement');
  });
});
