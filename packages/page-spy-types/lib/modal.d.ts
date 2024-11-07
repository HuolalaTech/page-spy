export interface ModalConfig {
  logo: string;
  title: string;
  content: string | Element;
  footer: (string | Element)[];
  mounted: Element;
}

export interface ShowParams {
  content: string | Element;
  footer: (string | Element)[];
}

export interface Modal {
  config: ModalConfig;
  build(cfg: Partial<ModalConfig>): void;
  show(args: Partial<ShowParams>): void;
  close(): void;
}
