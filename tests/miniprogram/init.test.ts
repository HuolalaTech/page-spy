import { isBrowser } from 'src/utils';

describe('Im in the right env', () => {
  it('Im in browser', () => {
    expect(isBrowser()).toBe(false);
  });
});
export {};
