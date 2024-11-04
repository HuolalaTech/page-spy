import { isString } from '@huolala-tech/page-spy-base';
import logoSvg from '../assets/modal-logo.svg';
import classes from './index.module.less';

interface ModalConfig {
  logo: string;
  title: string;
  content: string | HTMLElement;
  footer: (string | HTMLElement)[];
}

interface ShowParams {
  content?: string | HTMLElement;
  footer?: (string | HTMLElement)[];
}

const defaultConfig: ModalConfig = {
  logo: logoSvg,
  title: 'PageSpy',
  content: document.createElement('div'),
  footer: [],
};

export class modal {
  constructor() {
    if (new.target === modal) {
      throw new Error('Init not allowed');
    }
  }

  private static template = new DOMParser().parseFromString(
    `
    <div class="page-spy-modal ${classes.modal}">
      <div class="page-spy-header ${classes.header}">
        <div class="${classes.headerLeft}">
          <img class="${classes.logo}" />
          <b class="${classes.title}"></b>
        </div>
        <div class="${classes.headerRight}"></div>
      </div>
      <div class="page-spy-content ${classes.content}">
      
      </div>
      <div class="page-spy-footer ${classes.footer}">

      </div>
    </div>
    `,
    'text/html',
  );

  private static query(className: string) {
    return modal.template.querySelector.call(
      modal.template,
      `.${className}`,
    ) as HTMLElement;
  }

  public static config = defaultConfig;

  public static build(cfg: Partial<ModalConfig>) {
    modal.config = { ...modal.config, ...cfg };
  }

  public static show(args?: ShowParams) {
    const { logo, title, content, footer } = modal.config;
    const main = args?.content ?? content;
    const footerBtns = args?.footer ?? footer;

    const logoEl = modal.query(classes.logo) as HTMLImageElement;
    const titleEl = modal.query(classes.title);
    const contentEl = modal.query(classes.content);
    const footerEl = modal.query(classes.footer);

    logoEl.setAttribute('src', logo);
    titleEl.textContent = title;
    contentEl.innerHTML = isString(main) ? main : main.outerHTML;
    footerEl.innerHTML = footerBtns
      .map((i) => (isString(i) ? i : i.outerHTML))
      .join('\n');

    const root = modal.query(classes.modal);
    const exist = document.body.contains(root);
    if (!exist) {
      document.body.appendChild(root);
    }
    root.classList.add('show');
  }

  public static close() {
    const root = modal.query(classes.modal);
    const exist = document.body.contains(root);
    if (!exist) return;

    root.classList.remove('show');
    root.classList.add('leaving');
    setTimeout(() => {
      root.classList.remove('leaving');
    }, 300);
  }
}
