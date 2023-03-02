import type { InitConfig } from 'types';

const scriptLink = document.currentScript?.baseURI;

const defaultBase = () => {
  if (!scriptLink) return '';
  return new URL(scriptLink).host;
};

const defaultClientHost = () => {
  if (!scriptLink) return '';
  return new URL(scriptLink).origin;
};

const defaultConfig: Required<InitConfig> = {
  api: defaultBase(),
  clientHost: defaultClientHost(),
};

export const mergeConfig = (config: InitConfig): Required<InitConfig> => ({
  ...defaultConfig,
  ...config,
});
