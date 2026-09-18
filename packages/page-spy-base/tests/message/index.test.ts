import {
  makeBroadcastMessage,
  makeMessage,
  makeUnicastMessage,
} from 'page-spy-base/src';

describe('message builders', () => {
  it('adds an ID to messages by default', () => {
    const message = makeMessage('debug', { enabled: true });

    expect(message).toMatchObject({
      role: 'client',
      type: 'debug',
      data: { enabled: true },
    });
    expect(message.data).toMatchObject({ id: expect.any(String) });
  });

  it('omits an ID when requested', () => {
    const message = makeMessage('debug', { enabled: true }, false);

    expect(message).toEqual({
      role: 'client',
      type: 'debug',
      data: { enabled: true },
    });
  });

  it('wraps interactive messages in a unicast event', () => {
    const from = { address: 'client', name: 'Client', userId: 'client' };
    const to = { address: 'debugger', name: 'Debugger', userId: 'debugger' };
    const message = makeMessage('debug', { source: 'console' });

    expect(makeUnicastMessage(message, from, to)).toEqual({
      type: 'message',
      content: { data: message, from, to },
    });
  });

  it('wraps data messages in a broadcast event', () => {
    const message = makeMessage('console', { content: 'hello' });

    expect(makeBroadcastMessage(message)).toEqual({
      type: 'broadcast',
      content: { data: message },
    });
  });
});
