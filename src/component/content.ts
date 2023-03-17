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
    root.dataset.testid = 'content';
    root.className = ['page-spy-content', args.className].join(' ');
    root.onclick = (e) => {
      e.stopPropagation();
    };
    this.el = root;
    this.render();
  }

  render() {
    const { content = {}, onOk = () => {} } = this.options;
    const { name = '--', address = '--', clientOrigin } = content;
    const [os, browser] = name.split(' ');
    const contentText = `
      <p><b>Device ID:</b> <span style="font-family: 'Monaco'">${address.slice(
        0,
        4,
      )}</span></p>
      <p><b>System:</b> ${os}</p>
      <p><b>Browser:</b> ${browser}</p>
      `;
    // <p><b>Group:</b> <span style="font-family: 'Monaco'">${project}</span></p>

    /* info */
    const info = document.createElement('div');
    info.className = 'page-spy-content__info';
    info.innerHTML = contentText;
    /* bottom button */
    const button = document.createElement('div');
    button.dataset.testid = 'copy-button';
    button.className = 'page-spy-content__ok';
    button.textContent = 'Copy';
    button.onclick = (e) => {
      e.stopPropagation();
      const text = `${clientOrigin}/devtools?version=${name}&address=${address}`;
      const copyResult = copy(text);
      if (copyResult) {
        alert('Copy successfully!');
        onOk();
      }
    };
    this.el.append(info, button);
  }
}
