import { z } from 'zod';
import {
  ConfigBase,
  extendConfigSchema,
  InitConfigBase,
} from 'page-spy-base/src';

type TestConfigValue = InitConfigBase & { platformName?: string };

class TestConfig extends ConfigBase<TestConfigValue> {
  protected schema = extendConfigSchema(() =>
    z.object({ platformName: z.string().optional() }),
  );

  protected platform: TestConfigValue = {
    project: 'platform-project',
    platformName: 'test',
  };
}

describe('ConfigBase', () => {
  it('merges base, platform, and user values in priority order', () => {
    const config = new TestConfig();

    expect(config.mergeConfig({ project: 'user-project' })).toMatchObject({
      api: '',
      project: 'user-project',
      platformName: 'test',
      messageCapacity: 1000,
    });
  });

  it('rejects invalid configuration values', () => {
    const config = new TestConfig();

    expect(() => config.mergeConfig({ api: 'https://example.com' })).toThrow(
      'Just need host part in url',
    );
    expect(() => config.mergeConfig({ messageCapacity: 'large' })).toThrow(
      'Expected number, received string',
    );
  });

  it('updates individual configuration values', () => {
    const config = new TestConfig();
    config.mergeConfig({});

    config.set('title', 'updated title');
    expect(config.get().title).toBe('updated title');
  });
});
