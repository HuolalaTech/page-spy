import { parseSchemeWithScript } from 'src/packages/web/api';
import { Config } from 'src/utils/config';

describe('Web API utils fn', () => {
  it('parseSchemeWithScript', () => {
    const originLink = Config.scriptLink;

    // <script src="https://exp.com/page-spy/index.min.js"></script>
    Config.scriptLink = 'https://exp.com/page-spy/index.min.js';
    expect(parseSchemeWithScript()).toEqual(['https://', 'wss://']);

    // <script src="http://exp.com/page-spy/index.min.js"></script>
    Config.scriptLink = 'http://exp.com/page-spy/index.min.js';
    expect(parseSchemeWithScript()).toEqual(['http://', 'ws://']);

    // <script src="some-others://like-chrome-extension/page-spy/index.min.js"></script>
    Config.scriptLink =
      'some-others://like-chrome-extension/page-spy/index.min.js';
    expect(parseSchemeWithScript()).toEqual(['http://', 'ws://']);

    // reset to default
    Config.scriptLink = originLink;
  });
});
