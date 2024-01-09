import ConsolePlugin from 'src/plugins/console';

afterEach(() => {
  jest.restoreAllMocks();
  // wx.request = originRequest;
  ConsolePlugin.hasInitd = false;
});
describe('Console plugin', () => {
  it('When call console, the origin function is called ', () => {
    const logSpy = jest.spyOn(console, 'log');
    const plugin = new ConsolePlugin();
    plugin.onCreated();
    console.log('test');
    expect(logSpy).toBeCalled();
  });
});
