import type { InitConfig } from 'types';

const scriptLink = document.currentScript?.baseURI;

const defaultBase = () => {
  if (!scriptLink) return '';
  return new URL(scriptLink).host;
};

const defaultClientOrigin = () => {
  if (!scriptLink) return '';
  return new URL(scriptLink).origin;
};

const defaultConfig: Required<InitConfig> = {
  api: defaultBase(),
  clientOrigin: defaultClientOrigin(),
};

export const mergeConfig = (config: InitConfig): Required<InitConfig> => ({
  ...defaultConfig,
  ...config,
});
