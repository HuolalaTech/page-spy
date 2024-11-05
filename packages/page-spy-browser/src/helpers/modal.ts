import { isString } from '@huolala-tech/page-spy-base';
import classes from '../assets/styles/modal.module.less';
import closeSvg from '../assets/close.svg';

interface ModalConfig {
  logo: string;
  title: string;
  content: string | HTMLElement;
  footer: (string | HTMLElement)[];
  mounted: HTMLElement;
}

interface ShowParams {
  content?: string | HTMLElement;
  footer?: (string | HTMLElement)[];
}

const defaultConfig: ModalConfig = {
  logo: '',
  title: '',
  content: document.createElement('div'),
  footer: [],
  mounted: document.body,
};

export class modal {
  constructor() {
    if (new.target === modal) {
      throw new Error('Init not allowed');
    }
  }

  public static config = defaultConfig;

  public static root: HTMLDivElement;

  private static template = `
  <div class="page-spy-modal ${classes.modal}">
    <div class="${classes.content}">
      <!-- Header -->
      <div class="page-spy-header ${classes.header}">
        <div class="${classes.headerLeft}">
          <img class="${classes.logo}" />
          <b class="${classes.title}"></b>
        </div>
        <div class="${classes.headerRight}">
          <img class="${classes.close}" src="${closeSvg}" />
        </div>
      </div>

      <!-- Main content -->
      <div class="page-spy-content ${classes.main}"></div>

      <!-- Footer -->
      <div class="page-spy-footer ${classes.footer}"></div>
    </div>
  </div>
  `;

  private static get rendered() {
    return modal.root && modal.config.mounted.contains(modal.root);
  }

  private static query(className: string) {
    return modal.root.querySelector(`.${className}`) as HTMLElement;
  }

  public static build(cfg: Partial<ModalConfig>) {
    modal.config = { ...modal.config, ...cfg };
    if (!modal.root) {
      modal.root = new DOMParser()
        .parseFromString(modal.template, 'text/html')
        .querySelector('.page-spy-modal') as HTMLDivElement;
    }
  }

  public static show(args?: ShowParams) {
    const { logo, title, content, footer, mounted } = modal.config;
    const main = args?.content ?? content;
    const footerBtns = args?.footer ?? footer;

    const logoEl = modal.query(classes.logo) as HTMLImageElement;
    const titleEl = modal.query(classes.title);
    const mainEl = modal.query(classes.main);
    const footerEl = modal.query(classes.footer);

    logoEl.setAttribute('src', logo);
    titleEl.textContent = title;
    mainEl.innerHTML = '';
    if (isString(main)) {
      mainEl.insertAdjacentHTML('afterbegin', main);
    } else {
      mainEl.appendChild(main);
    }
    footerEl.innerHTML = '';
    footerBtns.forEach((b) => {
      if (isString(b)) {
        footerEl.insertAdjacentHTML('beforeend', b);
      } else {
        footerEl.insertAdjacentElement('beforeend', b);
      }
    });

    if (!modal.rendered) {
      mounted.appendChild(modal.root);
    }
    modal.root.classList.add('show');
  }

  public static close() {
    if (!modal.rendered) return;

    modal.root.classList.remove('show');
    modal.root.classList.add('leaving');
    setTimeout(() => {
      modal.root.classList.remove('leaving');
    }, 300);
  }
}
