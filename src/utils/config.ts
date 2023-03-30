import type { InitConfig } from 'types';

const scriptLink = (document.currentScript as HTMLScriptElement)?.src;

const defaultConfig = () => {
  if (!scriptLink) {
    return {
      api: '',
      clientOrigin: '',
      project: 'default',
    };
  }
  const { host, origin } = new URL(scriptLink);
  return {
    api: host,
    clientOrigin: origin,
    project: 'default',
  };
};

export const mergeConfig = (config: InitConfig): Required<InitConfig> => ({
  ...defaultConfig(),
  ...config,
});
