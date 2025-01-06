import type { Modal, Toast } from '@huolala-tech/page-spy-types';
import { psLog } from '@huolala-tech/page-spy-base/dist/utils';
import copy from 'copy-to-clipboard';
import classes from '../assets/index.module.less';
import {
  cropSvg,
  downloadAllSvg,
  uploadAllSvg,
  uploadPeriodsSvg,
  downloadPeriodsSvg,
  refreshSvg,
} from '../assets/svg';
import { t } from '../assets/locale';
import { PeriodItem } from '../harbor/base';
import { formatTimeDuration } from './index';
import type DataHarborPlugin from '../index';

function getLocaleTime(v: number) {
  return new Date(v).toLocaleTimeString('en', { hour12: false });
}

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
    <button class="page-spy-btn" data-primary id="upload-all">
      ${uploadAllSvg}
      <span>${t.uploadAll}</span>
    </button>
    <button class="page-spy-btn" data-primary id="download-all">
      ${downloadAllSvg}
      <span>${t.downloadAll}</span>
    </button>
    <button class="page-spy-btn" data-dashed id="upload-periods">
      ${uploadPeriodsSvg}
      <span>${t.uploadPeriods}</span>
    </button>
    <button class="page-spy-btn" data-dashed id="download-periods">
      ${downloadPeriodsSvg}
      <span>${t.downloadPeriods}</span>
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
  const uploadAllButton = $('#upload-all') as HTMLButtonElement;
  const downloadAllButton = $('#download-all') as HTMLButtonElement;
  const uploadPeriodsButton = $('#upload-periods') as HTMLButtonElement;
  const downloadPeriodsButton = $('#download-periods') as HTMLButtonElement;

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
    const { max, firstTime } = periodInfoRef;
    const minValue = +minThumb.value;
    const maxValue = +maxThumb.value;

    const left = minValue / max;
    const right = 1 - maxValue / max;
    range.style.setProperty('--left', `${(left * 100).toFixed(3)}%`);
    range.style.setProperty('--right', `${(right * 100).toFixed(3)}%`);

    const leftTime = firstTime + minValue * 1000;
    const rightTime = firstTime + maxValue * 1000;
    range.style.setProperty('--min-text', `"${getLocaleTime(leftTime)}"`);
    range.style.setProperty('--max-text', `"${getLocaleTime(rightTime)}"`);
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
  uploadAllButton.addEventListener('click', async () => {
    try {
      uploadAllButton.disabled = true;
      const debugUrl = await plugin.onOfflineLog('upload', {
        clearCache: false,
        remark: remark.value,
      });
      const ok = copy(debugUrl);
      psLog.info(`${t.success}: ${debugUrl}`);
      toast.message(ok ? t.copied : t.success);
    } catch (e: any) {
      psLog.error(e);
      toast.message(e.message);
    } finally {
      uploadAllButton.disabled = false;
    }
  });
  downloadAllButton.addEventListener('click', async () => {
    try {
      downloadAllButton.disabled = true;
      // await plugin.onOfflineLog('download', false);
      await plugin.onOfflineLog('download', {
        clearCache: false,
        remark: remark.value,
      });
      toast.message(t.success);
    } catch (e: any) {
      psLog.error(e);
      toast.message(e.message);
    } finally {
      downloadAllButton.disabled = false;
    }
  });
  uploadPeriodsButton.addEventListener('click', async () => {
    try {
      uploadPeriodsButton.disabled = true;
      const debugUrl = await plugin.onOfflineLog(
        'upload-periods',
        getSelectedPeriod(),
      );

      const ok = copy(debugUrl);
      psLog.info(`${t.success}: ${debugUrl}`);
      toast.message(ok ? t.copied : t.success);
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
      duration.textContent = formatTimeDuration(
        Date.now() - plugin.startTimestamp,
      );
      durationTimer = setInterval(() => {
        duration.textContent = formatTimeDuration(
          Date.now() - plugin.startTimestamp,
        );
      }, 1000);
    }
    refreshPeriods();

    modal.show({
      content: modalContent,
      footer: [
        uploadAllButton,
        uploadPeriodsButton,
        downloadAllButton,
        downloadPeriodsButton,
      ],
    });
  });

  modal.build({
    footer: [...modal.config.footer, openLogAction],
  });
};
