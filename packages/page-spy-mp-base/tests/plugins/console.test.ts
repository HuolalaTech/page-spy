import ConsolePlugin from 'page-spy-mp-base/src/plugins/console';

afterEach(() => {
  jest.restoreAllMocks();
});
describe('Console plugin', () => {
  it('When call console, the origin function is called ', () => {
    const logSpy = jest.spyOn(console, 'log');
    const plugin = new ConsolePlugin();
    plugin.onInit({} as any);
    console.log('test');
    expect(logSpy).toBeCalled();
    plugin.onReset();
  });
});
