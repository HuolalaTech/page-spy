/* eslint-disable no-console */
import PageSpy from '@huolala-tech/page-spy-browser';
import DataHarborPlugin from '@huolala-tech/page-spy-plugin-data-harbor';
import RRWebPlugin from '@huolala-tech/page-spy-plugin-rrweb';
import { dot, pageSpyExist } from './utils';
import classes from './styles/index.module.less';
import './styles/normalize.less';
import pageSpyLogo from './assets/logo.svg?raw';
import { moveable, UElement } from './utils/moveable';

interface Config {
  floatText?: string;
  /**
   * Online source: 'https://example.com/xxx.jpg'
   * Data url: 'data:image/png;base64,xxxx...'
   * Relative source: '../xxx.jpg'
   * Plain SVG content: '<svg>xxx</svg>'
   */
  logo?: string;
}

const defaultConfig: Config = {
  floatText: '问题反馈',
  logo: pageSpyLogo,
};

class WholeBundle {
  $pageSpy: PageSpy | null = null;

  $harbor: DataHarborPlugin | null = null;

  $rrweb: RRWebPlugin | null = null;

  constructor(public config: Config = defaultConfig) {
    if (pageSpyExist()) {
      console.info(
        "[PageSpy] [WholeBundle] Detected that PageSpy already exists in the current context, so I won't be inited.",
      );
    }
    this.init();
    this.render();
  }

  init() {
    [
      (this.$harbor = new DataHarborPlugin({})),
      (this.$rrweb = new RRWebPlugin()),
    ].forEach((p) => {
      PageSpy.registerPlugin(p);
    });

    this.$pageSpy = new PageSpy({
      offline: true,
      autoRender: false,
    });
  }

  render() {
    if (document.readyState === 'complete') {
      this.startRender();
    } else {
      window.addEventListener('DOMContentLoaded', this.startRender.bind(this));
    }
  }

  startRender() {
    const logo = this.getLogo();

    const doc = new DOMParser().parseFromString(
      `
      <div id="__pageSpyWholeBundle">
        <button class="${classes.float}">
          ${logo ?? ''}
          <span>${this.config.floatText}</span>
        </button>
        <div class="${classes.modal}">
          <div class="${classes.content}"></div>
        </div>
      </div>
      `,
      'text/html',
    );

    const root = doc.querySelector('#__pageSpyWholeBundle') as HTMLDivElement;
    const float = root.querySelector(dot(classes.float)) as UElement;
    moveable(float);
    document.body.insertAdjacentElement('beforeend', root);
  }

  getLogo() {
    const { logo } = this.config;
    if (!logo) return null;

    const isSvgContent = /<svg[^>]*>([\s\S]*?)<\/svg>/.test(logo);
    if (isSvgContent) return logo;

    try {
      const url = new URL(logo, window.location.href);
      return url.href;
    } catch (e) {
      return null;
    }
  }
}

export default new WholeBundle();
