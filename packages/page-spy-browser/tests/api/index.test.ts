import Request from 'page-spy-browser/src/api';
import { Config } from 'page-spy-browser/src/config';

describe('Web API utils fn', () => {
  it('parseSchemeWithScript', () => {
    const config = new Config();
    config.mergeConfig({
      api: 'init-api',
    });
    const request = new Request(config);
    const originLink = config.scriptLink;

    // <script src="https://exp.com/page-spy/index.min.js"></script>
    config.scriptLink = 'https://exp.com/page-spy/index.min.js';
    expect(request.parseSchemeWithScript()).toEqual(['https://', 'wss://']);

    // <script src="http://exp.com/page-spy/index.min.js"></script>
    config.scriptLink = 'http://exp.com/page-spy/index.min.js';
    expect(request.parseSchemeWithScript()).toEqual(['http://', 'ws://']);

    // <script src="some-others://like-chrome-extension/page-spy/index.min.js"></script>
    config.scriptLink =
      'some-others://like-chrome-extension/page-spy/index.min.js';
    expect(request.parseSchemeWithScript()).toEqual(['http://', 'ws://']);

    // reset to default
    config.scriptLink = originLink;
  });
});
