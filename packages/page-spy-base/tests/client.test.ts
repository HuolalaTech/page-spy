import { Client } from 'page-spy-base/src';

describe('Client', () => {
  it('uses default client information when none is provided', () => {
    const client = new Client();

    expect(client.getName()).toBe('unknown/unknown unknown/unknown');
    expect(client.makeClientInfoMsg()).toEqual({
      sdk: 'unknown',
      isDevTools: false,
      ua: 'unknown/unknown unknown/unknown',
      plugins: [],
    });
  });

  it('prefers an explicit user agent string', () => {
    const client = new Client({ ua: 'Custom UA', sdk: 'browser' });

    expect(client.getName()).toBe('Custom UA');
  });

  it('caches the derived user agent string', () => {
    const client = new Client({
      osType: 'ios',
      osVersion: '17.0',
      browserType: 'safari',
      browserVersion: '17.0',
    });

    expect(client.getName()).toBe('ios/17.0 safari/17.0');
    client.info.osVersion = '18.0';
    expect(client.getName()).toBe('ios/17.0 safari/17.0');
  });

  it('includes registered plugins in the client information message', () => {
    const client = new Client({ sdk: 'browser', isDevTools: true });
    client.plugins.push('console', 'network');

    expect(client.makeClientInfoMsg()).toMatchObject({
      sdk: 'browser',
      isDevTools: true,
      plugins: ['console', 'network'],
    });
  });
});
