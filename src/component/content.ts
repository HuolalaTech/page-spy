interface ContentParams {
  className?: string;
  tagName?: string;
  onOk?: () => void;
  content: string;
}

export class Content {
  options: ContentParams;

  el: HTMLElement;

  constructor(args: ContentParams) {
    this.options = {
      ...args,
    };
    /* root */
    const root = document.createElement('div');
    root.dataset.testid = 'content';
    root.className = ['page-spy-content', args.className].join(' ');
    /* c8 ignore next 3 */
    root.onclick = (e) => {
      e.stopPropagation();
    };
    this.el = root;
    this.render();
  }

  render() {
    const { content = '', onOk } = this.options;
    /* info */
    const info = document.createElement('div');
    info.className = 'page-spy-content__info';
    info.innerHTML = content;
    /* bottom button */
    const button = document.createElement('div');
    button.dataset.testid = 'copy-button';
    button.className = 'page-spy-content__ok';
    const lang = navigator.language;
    button.textContent = lang === 'zh-CN' ? '拷贝' : 'Copy';
    button.onclick = (e) => {
      e.stopPropagation();
      if (onOk) onOk();
    };
    this.el.append(info, button);
  }
}
