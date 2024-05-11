import ConsolePlugin from 'page-spy-react-native/src/plugins/console';

afterEach(() => {
  jest.restoreAllMocks();
});
describe('Console plugin', () => {
  it('When call console, the origin function is called ', () => {
    const logSpy = jest.spyOn(console, 'log');
    const plugin = new ConsolePlugin();
    plugin.onInit();
    console.log('test');
    expect(logSpy).toBeCalled();
    plugin.onReset();
  });
});
