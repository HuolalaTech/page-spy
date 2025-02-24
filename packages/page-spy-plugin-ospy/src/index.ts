/* eslint-disable consistent-return */
/* eslint-disable no-console */
import PageSpy from '@huolala-tech/page-spy-browser';
import DataHarborPlugin from '@huolala-tech/page-spy-plugin-data-harbor';
import RRWebPlugin from '@huolala-tech/page-spy-plugin-rrweb';
import { dot, pageSpyExist } from './utils';
import classes from './styles/index.module.less';
import './styles/normalize.less';
import { moveable, UElement } from './utils/moveable';
import { name } from '../package.json';
import { buildForm } from './utils/build-form';
import { modal } from './utils/modal';
import { ROOT_ID } from './utils/constant';
import { Config, defaultConfig } from './config';

class OSpy {
  $pageSpy: PageSpy | null = null;

  $harbor: DataHarborPlugin | null = null;

  $rrweb: RRWebPlugin | null = null;

  config: Config = defaultConfig;

  root: HTMLDivElement | null = null;

  static instance: OSpy | null = null;

  constructor(userCfg: Partial<Config> = {}) {
    if (pageSpyExist()) {
      console.info(
        `PageSpy is already exist, please remove it before using ${name}.`,
      );
      return;
    }
    if (OSpy.instance) {
      // eslint-disable-next-line no-constructor-return
      return OSpy.instance;
    }
    OSpy.instance = this;
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
      $harbor = new DataHarborPlugin({
        onDownload: this.config.onExportButtonClick,
      });
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
    const { title, logo, autoRender } = this.config;

    const doc = new DOMParser().parseFromString(
      `
      <div id="${ROOT_ID}" style="--primary-color: ${this.config.primaryColor}">
        ${
          autoRender
            ? `<button class="${classes.float}">
          <img src="${logo}" draggable="false" />
          <span>${title}</span>
        </button>`
            : ''
        }
      </div>
      `,
      'text/html',
    );

    const $c = (className: string) => {
      return doc.querySelector.bind(doc)(dot(className)) as HTMLElement;
    };
    this.root = doc.querySelector(`#${ROOT_ID}`) as HTMLDivElement;
    const float = $c(classes.float) as UElement;
    if (float) {
      moveable(float);
      float.addEventListener('click', () => {
        if (float.isMoveEvent) return;
        modal.show();
      });
    }
    const form = buildForm({
      harborPlugin: this.$harbor!,
      config: this.config,
    });

    modal.build({
      logo,
      title,
      content: form,
      mounted: this.root,
    });

    document.documentElement.insertAdjacentElement('beforeend', this.root);
  }

  open() {
    modal.show();
  }

  abort() {
    this.root?.remove();
    this.$pageSpy?.abort();
    OSpy.instance = null;
  }
}

export default OSpy;
