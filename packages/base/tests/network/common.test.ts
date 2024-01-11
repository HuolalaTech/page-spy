import { getFormattedBody } from 'base/src/network/common';
// import { getFormattedBody, resolveUrlInfo } from 'base/src/utils/network/common';

describe('Network common utils', () => {
  it('getFormattedBody()', () => {
    const bodyData = [
      new URLSearchParams(),
      new FormData(),
      new Blob(),
      new Uint8Array(),
      new Document(),
      '',
    ];

    bodyData.forEach((i) => {
      expect(() => {
        getFormattedBody(i);
      }).not.toThrow();
    });
  });
});
