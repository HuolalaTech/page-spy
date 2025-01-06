import type DataHarborPlugin from '@huolala-tech/page-spy-plugin-data-harbor';
import type { PeriodItem } from '@huolala-tech/page-spy-plugin-data-harbor/dist/types/harbor/base';
import classes from '../styles/index.module.less';
import refreshSvg from '../assets/refresh.svg?raw';
import { t } from './locale';
import { formatTime } from '.';
import { Toast } from './toast';
import { modal } from './modal';

function gapBetweenTextOnThumb(max: number) {
  if (max < 10) return 0.15;
  if (max < 30) return 0.13;
  return 0.1;
}

interface Params {
  harborPlugin: DataHarborPlugin;
}

export const buildForm = ({ harborPlugin }: Params) => {
  const { harbor } = harborPlugin;
  const doc = new DOMParser().parseFromString(
    `
    <form class="${classes.form}">
      <div class="${classes.formContent}">
        <!-- 表单项：选择时间段 -->
        <div class="${classes.formItem}">
          <label>
            <span>
              ${t.selectPeriod}: 
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
            <span>${t.remark}:</span>
          </label>
          <textarea name="description" rows="3" placeholder="${t.remarkPlaceholder}"></textarea>
        </div>
      </div>

      <!-- 底部 -->
      <div class="${classes.footer}">
        <div class="${classes.recorder}">
          <b>REC</b>
          <span class="${classes.duration}">--</span>
        </div>
        <button type="submit" data-primary>
          ${t.export}
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
  const duration = $c(classes.duration) as HTMLParagraphElement;

  setInterval(() => {
    if (harborPlugin.startTimestamp && duration) {
      const seconds = parseInt(
        String((Date.now() - harborPlugin.startTimestamp) / 1000),
        10,
      );
      duration.textContent = formatTime(seconds);
    }
  }, 1000);

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
    Toast.message(t.refreshed);
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
  const updateSubmitStatus = () => {
    const desc = description.value?.trim();
    if (desc) {
      submit.disabled = false;
    } else {
      submit.disabled = true;
    }
  };
  updateSubmitStatus();
  description.addEventListener('input', updateSubmitStatus);

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();

    try {
      submit.disabled = true;
      submit.textContent = t.readying;
      await harborPlugin!.onOfflineLog('download-periods', {
        ...getSelectedPeriod(),
        remark: `${description.value}`,
      });

      Toast.show('success', t.success);
      modal.close();
    } catch (e: any) {
      submit.textContent = t.fail;
      Toast.show('error', e.message);
    } finally {
      submit.textContent = t.export;
      submit.disabled = false;
    }
  });

  return form;
};
