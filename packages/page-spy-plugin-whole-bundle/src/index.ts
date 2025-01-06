/* eslint-disable consistent-return */
/* eslint-disable no-console */
import PageSpy from '@huolala-tech/page-spy-browser';
import DataHarborPlugin from '@huolala-tech/page-spy-plugin-data-harbor';
import RRWebPlugin from '@huolala-tech/page-spy-plugin-rrweb';
import { dot, pageSpyExist } from './utils';
import classes from './styles/index.module.less';
import './styles/normalize.less';
import pageSpyLogo from './assets/logo.svg';
import { moveable, UElement } from './utils/moveable';
import { name } from '../package.json';
import { buildForm } from './utils/build-form';
import { modal } from './utils/modal';

interface Config {
  title: string;
  /**
   * Online source: 'https://example.com/xxx.jpg'
   * Data url: 'data:image/png;base64,xxxx...'
   * Relative source: '../xxx.jpg'
   */
  logo: string;
  primaryColor: string;
}

const defaultConfig: Config = {
  title: '问题反馈',
  logo: pageSpyLogo,
  primaryColor: '#8434E9',
};

class WholeBundle {
  $pageSpy: PageSpy | null = null;

  $harbor: DataHarborPlugin | null = null;

  $rrweb: RRWebPlugin | null = null;

  config: Config = defaultConfig;

  static instance: WholeBundle | null = null;

  constructor(userCfg: Partial<Config> = {}) {
    if (pageSpyExist()) {
      console.info(
        `PageSpy is already exist, please remove it before using ${name}.`,
      );
      return;
    }
    if (WholeBundle.instance) {
      // eslint-disable-next-line no-constructor-return
      return WholeBundle.instance;
    }
    WholeBundle.instance = this;
    this.config = {
      ...defaultConfig,
      ...userCfg,
    };
    this.init();
    this.render();
  }

  init() {
    let $harbor = PageSpy.pluginsWithOrder.find(
      (i) => i.name === 'DataHarborPlugin',
    );
    if (!$harbor) {
      $harbor = new DataHarborPlugin();
      PageSpy.registerPlugin($harbor);
    }
    let $rrweb = PageSpy.pluginsWithOrder.find((i) => i.name === 'RRWebPlugin');
    if (!$rrweb) {
      $rrweb = new RRWebPlugin({
        recordCanvas: true,
        sampling: {
          canvas: 15,
        },
        dataURLOptions: {
          type: 'image/webp',
          quality: 0.6,
        },
      });
      PageSpy.registerPlugin($rrweb);
    }

    this.$harbor = $harbor as DataHarborPlugin;
    this.$rrweb = $rrweb as RRWebPlugin;
    this.$pageSpy = new PageSpy({
      offline: true,
      autoRender: false,
    });
  }

  render() {
    if (document.readyState !== 'loading') {
      this.startRender();
    } else {
      window.addEventListener('DOMContentLoaded', this.startRender.bind(this));
    }
  }

  startRender() {
    const { title, logo } = this.config;

    const doc = new DOMParser().parseFromString(
      `
      <div id="__pageSpyWholeBundle" style="--primary-color: ${this.config.primaryColor}">
        <button class="${classes.float}">
          <img src="${logo}" />
          <span>${title}</span>
        </button>
      </div>
      `,
      'text/html',
    );

    const $c = (className: string) => {
      return doc.querySelector.bind(doc)(dot(className)) as HTMLElement;
    };
    const root = doc.querySelector('#__pageSpyWholeBundle') as HTMLDivElement;
    const float = $c(classes.float) as UElement;
    moveable(float);
    float.addEventListener('click', () => {
      if (float.isMoveEvent) return;
      modal.show();
    });
    const form = buildForm({ harborPlugin: this.$harbor! });

    modal.build({
      logo,
      title,
      content: form,
      mounted: root,
    });

    document.documentElement.insertAdjacentElement('beforeend', root);
  }

  abort() {
    document.querySelector('#__pageSpyWholeBundle')?.remove();
    this.$pageSpy?.abort();
    WholeBundle.instance = null;
  }
}

const src = (document.currentScript as HTMLScriptElement)?.src;
// prettier-ignore
(function main() {
  if (!src) return;
  try {
    const { hash } = new URL(src, window.location.href);
    const userManual = hash.slice(1) === 'manual';
    if (!userManual) {
      window.$wholeBundle = new WholeBundle();
    }
  } catch (e) {
    //
  }
}());

export default WholeBundle;
