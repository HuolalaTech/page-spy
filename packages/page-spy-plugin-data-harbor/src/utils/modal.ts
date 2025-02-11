import type { Modal, Toast } from '@huolala-tech/page-spy-types';
import { psLog } from '@huolala-tech/page-spy-base/dist/utils';
import copy from 'copy-to-clipboard';
import classes from '../assets/index.module.less';
import {
  cropSvg,
  uploadPeriodsSvg,
  downloadPeriodsSvg,
  refreshSvg,
  successSvg,
  copySvg,
} from '../assets/svg';
import { t } from '../assets/locale';
import { PeriodItem } from '../harbor/base';
import { formatTime } from './index';
import type DataHarborPlugin from '../index';

function gapBetweenTextOnThumb(max: number) {
  if (max < 10) return 0.2;
  if (max < 30) return 0.16;
  return 0.135;
}

interface Params {
  plugin: DataHarborPlugin;
  modal: Modal;
  toast: Toast;
}

export const buildModal = ({ plugin, modal, toast }: Params) => {
  const doc = new DOMParser().parseFromString(
    `
    <!-- Add button for default modal -->
    <button class="page-spy-btn" data-dashed id="open-log-action">
      ${cropSvg}
      <span>${t.title}</span>
    </button>

    <!-- Show modal content on button#open-log-action clicked -->
    <div class="${classes.content}">
      <div class="${classes.timeInfo}">
        <div class="${classes.recorder}"></div>
        <div class="${classes.duration}"></div>
      </div>
      <div class="${classes.periodInfo}">
        <div class="${classes.label}">
          <div class="${classes.periodTips}">
            <b>${t.selectPeriod}</b>
          </div>
          <button class="${classes.refreshButton}">${refreshSvg}</button>
        </div>
        <div class="${classes.selectPeriod}">
          <div class="${classes.track}">
            <div class="${classes.range}"></div>
          </div>
          <input type="range" id="period-min" min="0" step="1" />
          <input type="range" id="period-max" min="0" step="1" />
        </div>
      </div>
      <div class="${classes.remarkInfo}">
        <div class="${classes.label}">${t.remark}</div>
        <textarea rows="5" id="harbor-remark" placeholder="${t.remarkPlaceholder}"></textarea>
      </div>
    </div>

    <!-- Upload / Download log button -->
    <button class="page-spy-btn" data-primary id="upload-periods">
      ${uploadPeriodsSvg}
      <span>${t.uploadPeriods}</span>
    </button>
    <button class="page-spy-btn" id="download-periods">
      ${downloadPeriodsSvg}
      <span>${t.downloadPeriods}</span>
    </button>

    <!-- Result -->
    <div class="${classes.result}">
      ${successSvg}
      <b>${t.success}</b>
    </div>

    <button class="page-spy-btn" data-primary id="copy-replay-url" data-url>
      ${copySvg}
      <span>${t.copyUrl}</span>
    </button>
    `,
    'text/html',
  );

  const $ = (selector: string) => {
    return doc.querySelector.call(doc, selector);
  };
  const $c = (c: string) => $(`.${c}`);

  const openLogAction = $('#open-log-action') as HTMLButtonElement;
  const modalContent = $c(classes.content) as HTMLDivElement;
  const refreshButton = $c(classes.refreshButton) as HTMLButtonElement;
  const range = $c(classes.range) as HTMLDivElement;
  const minThumb = $('#period-min') as HTMLInputElement;
  const maxThumb = $('#period-max') as HTMLInputElement;
  const remark = $('#harbor-remark') as HTMLInputElement;
  const uploadPeriodsButton = $('#upload-periods') as HTMLButtonElement;
  const downloadPeriodsButton = $('#download-periods') as HTMLButtonElement;
  const resultContent = $c(classes.result) as HTMLDivElement;
  const copyUrlButton = $('#copy-replay-url') as HTMLButtonElement;

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
    const periods = plugin.harbor.getPeriodList();
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
      remark: remark.value,
    };
  };

  refreshButton.addEventListener('click', () => {
    refreshButton.disabled = true;
    refreshPeriods();
    toast.message(t.refreshed);
    refreshButton.disabled = false;
  });
  minThumb.addEventListener('input', function () {
    const max = +maxThumb.value;
    const current = +this.value;
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
  maxThumb.addEventListener('input', function () {
    const min = +minThumb.value;
    const current = +this.value;
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
  copyUrlButton.addEventListener('click', () => {
    const { url } = copyUrlButton.dataset;
    const ok = copy(url!);
    toast.message(ok ? t.copied : t.copyFailed);
    modal.close();
  });
  uploadPeriodsButton.addEventListener('click', async () => {
    try {
      uploadPeriodsButton.disabled = true;
      const debugUrl = await plugin.onOfflineLog(
        'upload-periods',
        getSelectedPeriod(),
      );

      copyUrlButton.dataset.url = debugUrl;
      modal.show({
        content: resultContent,
        footer: [copyUrlButton],
      });
    } catch (e: any) {
      psLog.error(e);
      toast.message(e.message);
    } finally {
      uploadPeriodsButton.disabled = false;
    }
  });
  downloadPeriodsButton.addEventListener('click', async () => {
    try {
      downloadPeriodsButton.disabled = true;
      await plugin.onOfflineLog('download-periods', getSelectedPeriod());
      toast.message(t.success);
    } catch (e: any) {
      psLog.error(e);
      toast.message(e.message);
    } finally {
      downloadPeriodsButton.disabled = false;
    }
  });

  let durationTimer: ReturnType<typeof setInterval> | null = null;
  openLogAction?.addEventListener('click', () => {
    if (durationTimer) clearInterval(durationTimer);

    const duration = modalContent?.querySelector(`.${classes.duration}`);
    if (duration) {
      const fn = () => {
        const seconds = parseInt(
          String((Date.now() - plugin.startTimestamp) / 1000),
          10,
        );
        duration.textContent = formatTime(seconds);
      };
      fn();
      durationTimer = setInterval(fn, 1000);
    }
    refreshPeriods();

    modal.show({
      content: modalContent,
      footer: [uploadPeriodsButton, downloadPeriodsButton],
    });
  });

  modal.build({
    footer: [...modal.config.footer, openLogAction],
  });
};
