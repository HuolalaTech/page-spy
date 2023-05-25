import { blob2base64Async } from 'src/utils/blob';

describe('blob2base64Async', () => {
  test('should convert a Blob to base64', async () => {
    const mockBlob = new Blob(['Hello, world!'], { type: 'text/plain' });
    const result = await blob2base64Async(mockBlob);
    expect(result).toEqual('data:text/plain;base64,SGVsbG8sIHdvcmxkIQ==');
  });

  test('should reject with an error when conversion fails', async () => {
    const mockBlob = new Blob([], { type: 'application/octet-stream' });
    await expect(blob2base64Async(mockBlob)).rejects.toThrow(
      'blob2base64Async: can not convert',
    );
  });
});
