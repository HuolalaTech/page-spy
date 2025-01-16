import { isString } from '@huolala-tech/page-spy-base';
import type { ModalConfig, ShowParams } from '@huolala-tech/page-spy-types';
import classes from '../styles/modal.module.less';
import closeSvg from '../assets/close.svg';

const defaultConfig: Omit<ModalConfig, 'footer'> = {
  logo: '',
  title: '',
  content: document.createElement('div'),
  mounted: document.body || document.documentElement,
};

class Modal extends EventTarget {
  private config = defaultConfig;

  private root: HTMLDivElement | null = null;

  private template = `
  <div class="${classes.modal}">
    <div class="${classes.content}">
      <!-- Header -->
      <div class="${classes.header}">
        <div class="${classes.headerLeft}">
          <img class="${classes.logo}" />
          <div class="${classes.title}">
            <b></b>
            <p>
              <span>操作录制基于 PageSpy 技术实现，</span>
              <a href="https://pagespy.org" target="_blank">查看文档</a>
            </p>
          </div>
        </div>
        <div class="${classes.headerRight}">
          <img class="${classes.close}" src="${closeSvg}" />
        </div>
      </div>

      <!-- Main content -->
      <div class="${classes.main}"></div>
    </div>
  </div>
  `;

  private get rendered() {
    return this.config.mounted.contains(this.root);
  }

  private query(className: string) {
    return this.root?.querySelector(`.${className}`) as HTMLElement;
  }

  public build(cfg: Partial<ModalConfig>) {
    this.config = { ...this.config, ...cfg };
    if (!this.root) {
      this.root = new DOMParser()
        .parseFromString(this.template, 'text/html')
        .querySelector(`.${classes.modal}`) as HTMLDivElement;

      // mask
      this.root.addEventListener('click', (e) => {
        e.stopPropagation();
        this.close();
      });

      // content
      this.query(classes.content).addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // close
      this.query(classes.headerRight).addEventListener('click', () => {
        this.close();
      });

      // logo
      this.query(classes.logo).setAttribute('src', this.config.logo);

      // title
      this.query(classes.title).querySelector('b')!.textContent =
        this.config.title;
    }
  }

  public show(args?: Partial<ShowParams>) {
    if (!this.root) {
      console.warn('modal has not been ready.');
      return;
    }

    const { content, mounted } = this.config;
    const main = args?.content ?? content;

    const mainEl = this.query(classes.main);

    mainEl.innerHTML = '';
    if (isString(main)) {
      mainEl.insertAdjacentHTML('afterbegin', main);
    } else {
      mainEl.appendChild(main);
    }

    if (!this.rendered) {
      mounted.appendChild(this.root);
    }
    this.root.classList.add(classes.show);
    this.dispatchEvent(new Event('open'));
  }

  public close() {
    if (!this.root || !this.rendered) return;

    this.root.classList.remove(classes.show);
    this.root.classList.add(classes.leaving);
    setTimeout(() => {
      this.root?.classList.remove(classes.leaving);
      this.dispatchEvent(new Event('close'));
    }, 300);
  }

  public reset() {
    this.config = defaultConfig;
    this.root = null;
  }
}

export const modal = new Modal();
