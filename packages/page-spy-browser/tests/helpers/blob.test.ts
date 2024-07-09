import { blob2base64Async } from 'page-spy-base/src';

describe('blob2base64Async', () => {
  test('should convert a Blob to base64', async () => {
    const mockBlob = new Blob(['Hello, world!'], { type: 'text/plain' });
    const result = await blob2base64Async(mockBlob);
    expect(result).toEqual('data:text/plain;base64,SGVsbG8sIHdvcmxkIQ==');
  });
});
