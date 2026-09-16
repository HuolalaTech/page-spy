import ConsolePlugin from 'page-spy-browser/src/plugins/console';

describe('ConsolePlugin.handleDebugger', () => {
  it('returns non-Error values thrown by debugger code', () => {
    const reply = jest.fn();
    const debuggerConnection = {
      address: 'debugger',
      name: 'Debugger',
      userId: 'Debugger',
    };

    ConsolePlugin.handleDebugger(
      {
        source: {
          role: 'debugger',
          type: 'debug',
          data: "(() => { throw 'unavailable'; })()",
        },
        from: debuggerConnection,
        to: debuggerConnection,
      },
      reply,
    );

    expect(reply).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'console',
        data: expect.objectContaining({
          logType: 'error',
          logs: [expect.objectContaining({ value: 'unavailable' })],
        }),
      }),
    );
  });
});
