import { StoragePlugin } from 'src/plugins/storage';

const trigger = jest.fn();
jest.spyOn(StoragePlugin, 'sendStorageItem').mockImplementation(trigger);

describe('Storage plugin', () => {
  it('Storage action', () => {
    localStorage.setItem('1', '1');
    sessionStorage.setItem('2', '2');
    document.cookie = '3=3';
    new StoragePlugin().onCreated();
    expect(trigger).toHaveBeenCalledTimes(3);

    localStorage.removeItem('1');
    sessionStorage.removeItem('1');
    expect(trigger).toHaveBeenCalledTimes(5);

    localStorage.clear();
    sessionStorage.clear();
    expect(trigger).toHaveBeenCalledTimes(7);
  });
});
