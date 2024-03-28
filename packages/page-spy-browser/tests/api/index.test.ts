import Request from 'page-spy-browser/src/api';
import { Config } from 'page-spy-browser/src/config';

describe('Web API utils fn', () => {
  it('getScheme', () => {
    const originLink = Config.scriptLink;

    // <script src="https://exp.com/page-spy/index.min.js"></script>
    Config.scriptLink = 'https://exp.com/page-spy/index.min.js';
    const config1 = new Config();
    config1.mergeConfig({
      api: 'init-api',
    });
    const request1 = new Request(config1.get());
    expect(request1.getScheme()).toEqual(['https://', 'wss://']);

    // <script src="http://exp.com/page-spy/index.min.js"></script>
    Config.scriptLink = 'http://exp.com/page-spy/index.min.js';
    const config2 = new Config();
    config2.mergeConfig({
      api: 'init-api',
    });
    const request2 = new Request(config2.get());
    expect(request2.getScheme()).toEqual(['http://', 'ws://']);

    // <script src="some-others://like-chrome-extension/page-spy/index.min.js"></script>
    Config.scriptLink =
      'some-others://like-chrome-extension/page-spy/index.min.js';
    const config3 = new Config();
    config3.mergeConfig({
      api: 'init-api',
    });
    const request3 = new Request(config3.get());
    expect(request3.getScheme()).toEqual(['http://', 'ws://']);

    // reset to default
    Config.scriptLink = originLink;
  });
});
