import socket from 'page-spy-browser/src/helpers/socket';
import SystemPlugin from 'page-spy-browser/src/plugins/system';
import { computeResult } from 'page-spy-browser/src/plugins/system/feature';

describe('System plugin', () => {
  it('computeResult()', async () => {
    const result = await computeResult();

    const features = [
      'Element',
      'Feature',
      'Network',
      'Javascript',
      'Storage',
    ] as const;

    expect(Object.keys(result)).toEqual(features);

    for (const key of features) {
      expect(result[key]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            keyPath: expect.any(String),
            title: expect.any(String),
          }),
        ]),
      );
    }
  });
});
