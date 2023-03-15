import type { InitConfig } from 'types';

const scriptLink = (document.currentScript as HTMLScriptElement)?.src;

const defaultBase = () => {
  if (!scriptLink) return '';
  return new URL(scriptLink).host;
};

const defaultClientOrigin = () => {
  if (!scriptLink) return '';
  return new URL(scriptLink).origin;
};

const defaultConfig = () => ({
  api: defaultBase(),
  clientOrigin: defaultClientOrigin(),
});

export const mergeConfig = (config: InitConfig): Required<InitConfig> => ({
  ...defaultConfig(),
  ...config,
});
