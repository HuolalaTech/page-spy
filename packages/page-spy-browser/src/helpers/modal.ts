import { isString, psLog } from '@huolala-tech/page-spy-base';
import { ModalConfig, ShowParams } from '@huolala-tech/page-spy-types';
import classes from '../assets/styles/modal.module.less';
import closeSvg from '../assets/close.svg';

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
      throw new Error('Cannot call `new modal()`');
    }
  }

  public static config = defaultConfig;

  private static root: HTMLDivElement | null;

  private static template = `
  <div class="${classes.modal}">
    <div class="${classes.content}">
      <!-- Header -->
      <div class="${classes.header}">
        <div class="${classes.headerLeft}">
          <img class="${classes.logo}" />
          <b class="${classes.title}"></b>
        </div>
        <div class="${classes.headerRight}">
          <img class="${classes.close}" src="${closeSvg}" />
        </div>
      </div>

      <!-- Main content -->
      <div class="${classes.main}"></div>

      <!-- Footer -->
      <div class="${classes.footer}"></div>
    </div>
  </div>
  `;

  private static get rendered() {
    return modal.config.mounted.contains(modal.root);
  }

  private static query(className: string) {
    return modal.root?.querySelector(`.${className}`) as HTMLElement;
  }

  public static build(cfg: Partial<ModalConfig>) {
    modal.config = { ...modal.config, ...cfg };
    if (!modal.root) {
      modal.root = new DOMParser()
        .parseFromString(modal.template, 'text/html')
        .querySelector(`.${classes.modal}`) as HTMLDivElement;

      // mask
      modal.root.addEventListener('click', (e) => {
        e.stopPropagation();
        modal.close();
      });

      // content
      modal.query(classes.content).addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
      });

      // close
      modal.query(classes.headerRight).addEventListener('click', () => {
        modal.close();
      });

      // logo
      modal.query(classes.logo).setAttribute('src', modal.config.logo);

      // title
      modal.query(classes.title).textContent = modal.config.title;
    }
  }

  public static show(args?: Partial<ShowParams>) {
    if (!modal.root) {
      psLog.info('modal has not been ready.');
      return;
    }

    const { content, footer, mounted } = modal.config;
    const main = args?.content ?? content;
    const footerBtns = args?.footer ?? footer;

    const mainEl = modal.query(classes.main);
    const footerEl = modal.query(classes.footer);

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
    if (!modal.root || !modal.rendered) return;

    modal.root.classList.remove('show');
    modal.root.classList.add('leaving');
    setTimeout(() => {
      modal.root?.classList.remove('leaving');
    }, 300);
  }

  public static reset() {
    modal.config = defaultConfig;
    modal.root = null;
  }
}
