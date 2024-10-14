/* eslint-disable consistent-return */
/* eslint-disable no-console */
import PageSpy from '@huolala-tech/page-spy-browser';
import DataHarborPlugin from '@huolala-tech/page-spy-plugin-data-harbor';
import RRWebPlugin from '@huolala-tech/page-spy-plugin-rrweb';
import { dot, formatTime, pageSpyExist } from './utils';
import classes from './styles/index.module.less';
import './styles/normalize.less';
import pageSpyLogo from './assets/logo.svg?raw';
import closeSvg from './assets/close.svg?raw';
import exportSvg from './assets/export.svg?raw';
import replaySvg from './assets/replay.svg?raw';
import { moveable, UElement } from './utils/moveable';

interface Config {
  title?: string;
  /**
   * Online source: 'https://example.com/xxx.jpg'
   * Data url: 'data:image/png;base64,xxxx...'
   * Relative source: '../xxx.jpg'
   * Plain SVG content: '<svg>xxx</svg>'
   */
  logo?: string;
  statement?: string;
  replayLabUrl?: string;
}

class WholeBundle {
  $pageSpy: PageSpy | null = null;

  $harbor: DataHarborPlugin | null = null;

  $rrweb: RRWebPlugin | null = null;

  config: Config = {
    title: '问题反馈',
    logo: pageSpyLogo,
    statement:
      '声明：「问题反馈」组件处理的所有数据都是保存在您本地，不会主动将数据传输到任何服务器，可放心使用。',
    replayLabUrl: 'https://pagespy.org/#/replay-lab',
  };

  startTime = 0;

  timer: ReturnType<typeof setInterval> | null = null;

  static instance: WholeBundle | null = null;

  constructor(userCfg?: Config) {
    if (pageSpyExist()) {
      console.info(
        "[PageSpy] [WholeBundle] Detected that PageSpy already exists in the current context, so I won't be inited.",
      );
      return;
    }
    if (WholeBundle.instance) {
      // eslint-disable-next-line no-constructor-return
      return WholeBundle.instance;
    }
    WholeBundle.instance = this;
    this.config = {
      ...this.config,
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
    this.startTime = Date.now();
  }

  render() {
    if (document.readyState !== 'loading') {
      this.startRender();
    } else {
      window.addEventListener('DOMContentLoaded', this.startRender.bind(this));
    }
  }

  startRender() {
    const logo = this.getLogo();
    const { statement, title, replayLabUrl } = this.config;

    const doc = new DOMParser().parseFromString(
      `
      <div id="__pageSpyWholeBundle">
        <button class="${classes.float}">
          ${logo ?? ''}
          <span>${title}</span>
        </button>
        <div class="${classes.modal}">
          <div class="${classes.content}">
            <div class="${classes.header}">
              <div class="${classes.h_left}">
                ${logo ?? ''}
                <div class="${classes.h_title}">
                  <b>${title}</b>
                  <br />
                  <span>操作录制基于 PageSpy 技术实现，<a href="https://github.com/HuolalaTech/page-spy-web" target="_blank">查看详情</a>。</span>
                </div>
              </div>
              <div class="${classes.h_right}">
                ${closeSvg}
              </div>
            </div>
            <div class="${classes.main}">
              <div class="${classes.m_process}">
                <div class="${classes.m_p_item}">
                  ${exportSvg}
                  <b>1. 导出文件到本地</b>
                </div>
                <div class="${classes.m_p_item}">
                  ${replaySvg}
                  <b>2. 前往 <a href="${replayLabUrl}" target="_blank">回放实验室</a> 查看</b>
                </div>
              </div>
              <div class="${classes.m_statement}">
                ${statement}
              </div>
            </div>
            <div class="${classes.footer}">
              <div class="${classes.f_left}">
                <b>REC</b>
                <span class="${classes.f_duration}">--</span>
              </div>
              <div class="${classes.f_right}">
                <button class="${classes.f_export}">导出</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      `,
      'text/html',
    );

    const $c = (name: string) => {
      return doc.querySelector.bind(doc)(dot(name)) as HTMLElement;
    };
    const root = doc.querySelector('#__pageSpyWholeBundle') as HTMLDivElement;
    const float = $c(classes.float) as UElement;
    const modal = $c(classes.modal);
    const close = $c(classes.h_right);
    const content = $c(classes.content);
    const duration = $c(classes.f_duration);
    const exportBtn = $c(classes.f_export) as HTMLButtonElement;

    const openModal = () => {
      if (float.isMoveEvent) return;
      modal.classList.add(classes.show);
    };
    float.addEventListener('click', openModal);
    moveable(float);
    const closeModal = () => {
      modal.classList.remove(classes.show);
      modal.classList.add(classes.leaving);
      setTimeout(() => {
        modal.classList.remove(classes.leaving);
      }, 300);
    };
    close.addEventListener('click', closeModal);
    modal.addEventListener('click', closeModal);
    content.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    if (this.startTime && duration) {
      this.timer = setInterval(() => {
        const seconds = parseInt(
          String((Date.now() - this.startTime) / 1000),
          10,
        );
        duration.textContent = formatTime(seconds);
      }, 1000);
    }
    exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      exportBtn.textContent = '处理中';
      await this.$harbor?.onOfflineLog('download');
      exportBtn.textContent = '导出成功';
      setTimeout(() => {
        exportBtn.disabled = false;
        exportBtn.textContent = '导出';
      }, 1500);
    });

    document.body.insertAdjacentElement('beforeend', root);
  }

  getLogo() {
    const { logo } = this.config;
    if (!logo) return null;

    const isSvgContent = /<svg[^>]*>([\s\S]*?)<\/svg>/.test(logo);
    if (isSvgContent) return logo;

    try {
      const url = new URL(logo, window.location.href);
      return `<img src="${url.href}" alt="logo" />`;
    } catch (e) {
      return null;
    }
  }

  abort() {
    document.querySelector('#__pageSpyWholeBundle')?.remove();
    this.$pageSpy?.abort();
    if (this.timer) {
      clearInterval(this.timer);
    }
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
