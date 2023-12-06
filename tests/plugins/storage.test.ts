import { StoragePlugin } from 'src/plugins/storage';

// @ts-ignore
const trigger = jest.spyOn(StoragePlugin, 'sendStorageItem');

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = '';
});
afterEach(() => {
  jest.resetAllMocks();
});

describe('Storage plugin', () => {
  it('cookieStore / localStorage /sessionStorage', async () => {
    new StoragePlugin().onCreated();
    await cookieStore.set('1', '1');
    await cookieStore.set('2', '2');
    expect(trigger).toHaveBeenCalledTimes(2);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'cookie',
        action: 'set',
      }),
    );
    await cookieStore.delete('1');
    await cookieStore.delete('2');
    expect(trigger).toHaveBeenCalledTimes(4);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'cookie',
        action: 'remove',
      }),
    );
    localStorage.setItem('1', '1');
    localStorage.removeItem('1');
    expect(trigger).toHaveBeenCalledTimes(6);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'localStorage',
        action: 'remove',
      }),
    );
    sessionStorage.setItem('2', '2');
    sessionStorage.removeItem('2');
    expect(trigger).toHaveBeenCalledTimes(8);
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'sessionStorage',
        action: 'remove',
      }),
    );
    localStorage.clear();
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'localStorage',
        action: 'clear',
      }),
    );
    expect(trigger).toHaveBeenCalledTimes(9);
    sessionStorage.clear();
    expect(trigger).lastCalledWith(
      expect.objectContaining({
        type: 'sessionStorage',
        action: 'clear',
      }),
    );
    expect(trigger).toHaveBeenCalledTimes(10);
  });
});
