import type DataHarborPlugin from '@huolala-tech/page-spy-plugin-data-harbor';
import type { PeriodItem } from '@huolala-tech/page-spy-plugin-data-harbor/dist/types/harbor/base';
import classes from '../styles/index.module.less';
import refreshSvg from '../assets/refresh.svg?raw';
import pauseSvg from '../assets/pause.svg?raw';
import infoSvg from '../assets/info.svg?raw';
import { i18n } from './locale';
import { formatTime } from '.';
import { Toast } from './toast';
import { modal } from './modal';
import { Config } from '../config';

function gapBetweenTextOnThumb(max: number) {
  if (max < 10) return 0.15;
  if (max < 30) return 0.13;
  return 0.1;
}

interface Params {
  harborPlugin: DataHarborPlugin;
  config: Config;
}

export const buildForm = ({ harborPlugin, config }: Params) => {
  const { harbor } = harborPlugin;
  const doc = new DOMParser().parseFromString(
    `
    <form class="${classes.form}">
      <div class="${classes.formContent}">
        <!-- 表单项：选择时间段 -->
        <div class="${classes.formItem}">
          <label>
            <span>
              ${i18n.t('selectPeriod')}: 
            </span>
            <button class="${classes.refreshButton}" type="button">${refreshSvg}</button>
          </label>
          <div class="${classes.selectPeriod}">
            <div class="${classes.track}">
              <div class="${classes.range}"></div>
            </div>
            <input type="range" id="period-min" min="0" step="1" />
            <input type="range" id="period-max" min="0" step="1" />
          </div>
        </div>

        <!-- 表单项：备注信息 -->
        <div class="${classes.formItem}">
          <label>
            <span>${i18n.t('remark')}:</span>
          </label>
          <textarea name="description" rows="3" placeholder="${i18n.t('remarkPlaceholder')}"></textarea>
        </div>
      </div>

      <!-- 底部 -->
      <div class="${classes.footer}">
        <div class="${classes.recorder}">
          <div>
            <b>REC</b>
            <span class="${classes.duration}">--</span>
          </div>
          <div>
            ${pauseSvg}
            <b>${i18n.t('paused')}</b>
            <div class="${classes.pausedInfo}">
              ${infoSvg}
              <div class="${classes.pausedInfoText}">
                <span>${i18n.t('pausedInfoText')}</span>
              </div>
            </div>
          </div>
        </div>
        <button type="submit" data-primary>
          ${config.exportButtonText || i18n.t('export')}
        </button>
      </div>
    </form>`,
    'text/html',
  );
  const $ = (selector: string) => {
    return doc.querySelector.call(doc, selector);
  };
  const $c = (c: string) => $(`.${c}`);
  const form = $c(classes.form) as HTMLFormElement;
  const refreshButton = $c(classes.refreshButton) as HTMLButtonElement;
  const range = $c(classes.range) as HTMLDivElement;
  const minThumb = $('#period-min') as HTMLInputElement;
  const maxThumb = $('#period-max') as HTMLInputElement;
  const recorder = $c(classes.recorder) as HTMLDivElement;
  const duration = $c(classes.duration) as HTMLParagraphElement;
  const pausedInfo = $c(classes.pausedInfo) as HTMLDivElement;
  const recorderFn = () => {
    const { isPaused, startTimestamp } = harborPlugin;
    if (isPaused) {
      recorder.classList.add(classes.paused);
      return;
    }

    recorder.classList.remove(classes.paused);
    if (startTimestamp && duration) {
      const seconds = parseInt(
        String((Date.now() - harborPlugin.startTimestamp) / 1000),
        10,
      );
      duration.textContent = formatTime(seconds);
    }
  };
  recorderFn();
  setInterval(recorderFn, 1000);
  recorder.addEventListener('click', () => {
    if (harborPlugin.isPaused) {
      harborPlugin.resume();
    } else {
      harborPlugin.pause();
    }
    recorderFn();
  });
  pausedInfo.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  const periodInfoRef: {
    max: number;
    periods: PeriodItem[];
    firstTime: number;
    lastTime: number;
  } = {
    max: 0,
    periods: [],
    firstTime: 0,
    lastTime: 0,
  };
  const updateRangeInTrack = () => {
    const { max } = periodInfoRef;
    const minValue = +minThumb.value;
    const maxValue = +maxThumb.value;

    const left = minValue / max;
    const right = 1 - maxValue / max;
    range.style.setProperty('--left', `${(left * 100).toFixed(3)}%`);
    range.style.setProperty('--right', `${(right * 100).toFixed(3)}%`);

    range.style.setProperty('--min-text', `"${formatTime(minValue)}"`);
    range.style.setProperty('--max-text', `"${formatTime(maxValue)}"`);
  };

  const refreshPeriods = () => {
    const periods = harbor.getPeriodList();
    const firstTime = periods[0].time.getTime();
    const lastTime = periods[periods.length - 1].time.getTime();

    const seconds = Math.floor((lastTime - firstTime) / 1000);
    const max = seconds.toString();

    minThumb.max = max;
    minThumb.value = '0';

    maxThumb.max = max;
    maxThumb.value = max;

    periodInfoRef.max = seconds;
    periodInfoRef.periods = periods;
    periodInfoRef.firstTime = firstTime;
    periodInfoRef.lastTime = lastTime;

    updateRangeInTrack();
  };
  const getSelectedPeriod = () => {
    const { firstTime } = periodInfoRef;
    const minValue = +minThumb.value;
    const maxValue = +maxThumb.value;

    const startTime = firstTime + minValue * 1000;
    const endTime = firstTime + maxValue * 1000;

    return {
      startTime,
      endTime,
    };
  };

  refreshButton.addEventListener('click', () => {
    refreshButton.disabled = true;
    refreshPeriods();
    Toast.message(i18n.t('refreshed'));
    refreshButton.disabled = false;
  });
  minThumb.addEventListener('input', () => {
    const max = +maxThumb.value;
    const current = +minThumb.value;
    if (current > max - 1) {
      minThumb.value = String(max - 1);
      return;
    }
    const percent = (max - current) / periodInfoRef.max;
    if (percent <= gapBetweenTextOnThumb(periodInfoRef.max)) {
      range.dataset.maxTextPosition = 'bottom';
    } else {
      range.dataset.maxTextPosition = 'top';
    }
    range.dataset.minTextPosition = 'top';
    updateRangeInTrack();
  });
  maxThumb.addEventListener('input', () => {
    const min = +minThumb.value;
    const current = +maxThumb.value;
    if (current < min + 1) {
      maxThumb.value = String(min + 1);
      return;
    }
    const percent = (current - min) / periodInfoRef.max;
    if (percent <= gapBetweenTextOnThumb(periodInfoRef.max)) {
      range.dataset.minTextPosition = 'bottom';
    } else {
      range.dataset.minTextPosition = 'top';
    }
    range.dataset.maxTextPosition = 'top';
    updateRangeInTrack();
  });

  modal.addEventListener('open', () => {
    refreshPeriods();
  });

  const description = form.querySelector('textarea') as HTMLTextAreaElement;
  // prettier-ignore
  const submit = form.querySelector('button[type="submit"]') as HTMLButtonElement;

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();

    try {
      submit.disabled = true;
      submit.textContent = i18n.t('readying');
      await harborPlugin!.onOfflineLog('download-periods', {
        ...getSelectedPeriod(),
        remark: `${description.value}`,
      });

      Toast.show('success', i18n.t('success'));
      modal.close();
    } catch (e: any) {
      submit.textContent = i18n.t('fail');
      Toast.show('error', e.message);
    } finally {
      submit.textContent = i18n.t('export');
      submit.disabled = false;
    }
  });

  return form;
};
