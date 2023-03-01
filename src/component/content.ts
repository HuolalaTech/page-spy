import copy from 'copy-to-clipboard';

interface ContentParams {
  className?: string;
  tagName?: string;
  onOk?: () => void;
  content: Record<string, any>;
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
    root.className = ['page-spy-content', args.className].join(' ');
    root.onclick = (e) => {
      e.stopPropagation();
    };
    this.el = root;
    this.render();
  }

  render() {
    const { content = {}, onOk = () => {} } = this.options;
    const { name = '--', address = '--', project = '--' } = content;
    const contentText = `
      <p><b>System:</b> ${name}</p>
      <p><b>Device ID:</b> <span style="font-family: 'Monaco'">${address}</span></p>
      <p><b>Group:</b> <span style="font-family: 'Monaco'">${project}</span></p>
    `;

    /* info */
    const info = document.createElement('div');
    info.className = 'page-spy-content__info';
    info.innerHTML = contentText;
    /* bottom button */
    const button = document.createElement('div');
    button.className = 'page-spy-content__ok';
    button.textContent = 'Copy';
    button.onclick = (e) => {
      e.stopPropagation();
      const copyResult = copy(`${address}`);
      if (copyResult) {
        alert('Copy successfully!');
        onOk();
      }
    };
    this.el.append(info, button);
  }
}
