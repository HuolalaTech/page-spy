import { StoragePlugin } from 'src/plugins/storage';

const trigger = jest.spyOn(StoragePlugin, 'sendStorageItem');

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = '';
});
afterEach(() => {
  jest.restoreAllMocks();
});

describe('Storage plugin', () => {
  it('cookieStore / localStorage /sessionStorage', async () => {
    new StoragePlugin().onCreated();
    await cookieStore.set('1', '1');
    await cookieStore.set('2', '2');
    expect(trigger).toHaveBeenCalledTimes(3);
    await cookieStore.delete('1');
    await cookieStore.delete('2');
    expect(trigger).toHaveBeenCalledTimes(5);
    localStorage.setItem('1', '1');
    sessionStorage.setItem('2', '2');
    expect(trigger).toHaveBeenCalledTimes(7);
    localStorage.removeItem('1');
    sessionStorage.removeItem('2');
    expect(trigger).toHaveBeenCalledTimes(9);
    localStorage.clear();
    sessionStorage.clear();
    expect(trigger).toHaveBeenCalledTimes(11);
  });
});
