import { isCN } from 'base/src';

interface ContentParams {
  className?: string;
  tagName?: string;
  onOk?: () => void;
  content: string;
}

export class Content {
  options: ContentParams;

  el: HTMLDivElement;

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
    button.className = 'page-spy-content__btn';
    button.textContent = isCN() ? '复制在线调试链接' : 'Copy debug link';
    button.onclick = (e) => {
      e.stopPropagation();
      if (onOk) onOk();
    };
    this.el.insertAdjacentElement('beforeend', info);
    this.el.insertAdjacentElement('beforeend', button);
  }
}
