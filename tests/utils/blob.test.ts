import { blob2base64 } from 'src/utils/blob';

describe('Blob utils', () => {
  it('Convert blob to base64', (done) => {
    const content = 'Hello PageSpy';
    const blob = new Blob([content], { type: 'text/plain' });
    const cb = jest.fn((data: any) => data);
    expect.assertions(1);
    blob2base64(blob, (data) => {
      const code = data.split(',')[1];
      expect(atob(code)).toBe(content);
      done();
    });
  });
});
