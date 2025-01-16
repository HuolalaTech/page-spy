import { computeResult } from 'page-spy-browser/src/plugins/system/feature';

describe('System plugin', () => {
  it('computeResult()', async () => {
    const result = await computeResult();

    const features = [
      'Feature',
      'Network',
      'Javascript',
      'CSS',
      'Element',
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
