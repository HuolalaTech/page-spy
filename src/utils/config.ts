import type { InitConfig } from 'types';

const defaultBase = () => {
  const host = document.currentScript?.baseURI;
  if (!host) return '';
  return new URL(host).origin;
};

const defaultTitle = () => document.title;

const defaultConfig: Required<InitConfig> = {
  api: defaultBase(),
  project: defaultTitle(),
};

export const mergeConfig = (config: InitConfig): Required<InitConfig> => ({
  ...defaultConfig,
  ...config,
});
