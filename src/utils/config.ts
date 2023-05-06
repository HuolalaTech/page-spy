import type { InitConfig } from 'types';

const scriptLink = (document.currentScript as HTMLScriptElement)?.src;

const defaultConfig = {
  api: '',
  clientOrigin: '',
  project: 'default',
};

const resolveConfig = () => {
  /* c8 ignore next 3 */
  if (!scriptLink) {
    return null;
  }
  const { host, origin } = new URL(scriptLink);
  return {
    api: host,
    clientOrigin: origin,
    project: 'default',
  };
};

export const mergeConfig = (config: InitConfig): Required<InitConfig> => ({
  /* c8 ignore next */
  ...(resolveConfig() || defaultConfig),
  ...config,
});
