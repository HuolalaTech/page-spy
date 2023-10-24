import { StoragePlugin } from 'src/plugins/storage';

// @ts-ignore
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
    expect(trigger).toHaveBeenCalledTimes(2);
    await cookieStore.delete('1');
    await cookieStore.delete('2');
    expect(trigger).toHaveBeenCalledTimes(4);
    localStorage.setItem('1', '1');
    sessionStorage.setItem('2', '2');
    expect(trigger).toHaveBeenCalledTimes(6);
    localStorage.removeItem('1');
    sessionStorage.removeItem('2');
    expect(trigger).toHaveBeenCalledTimes(8);
    localStorage.clear();
    sessionStorage.clear();
    expect(trigger).toHaveBeenCalledTimes(10);
  });
});
