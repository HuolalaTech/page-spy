import NetworkPlugin from 'src/plugins/network';

beforeAll(() => {
  new NetworkPlugin().onCreated();
});

describe('Network plugin', () => {
  it('XHR request', () => {
    function xhrRequest() {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://example.com');
      xhr.setRequestHeader('x-from', 'page-spy');
      xhr.send();
    }

    expect(xhrRequest).not.toThrow();
  });

  it('fetch request', () => {
    async function fecthRequest() {
      await fetch('https://example.com', { method: 'GET' });
      await fetch(new URL('https://example.com'));
      await fetch(new Request('https://example.com'));
    }
    expect(fecthRequest).not.toThrow();
  });

  it('sendBeacon request', () => {
    function sendBeaconRequest() {
      const data = new FormData();
      data.append('firstname', 'hello');
      data.append('lastname', 'pagespy');

      navigator.sendBeacon('https://example.com', data);
    }
    expect(sendBeaconRequest).not.toThrow();
  });
});
