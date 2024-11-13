import type { Modal, Toast } from '@huolala-tech/page-spy-types';
import { isNumber, psLog } from '@huolala-tech/page-spy-base';
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
import { PeriodItem } from '../harbor/blob';
import { copyInBrowser, formatTimeDuration } from '../utils';
import type DataHarborPlugin from '.';

function formatPeriodDuration(period: number) {
  const invalid = !period || !isNumber(+period);
  const value = invalid ? 0 : (period / 60 / 1000).toFixed(2);

  return `${value} ${t.minutes}`;
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
            <span class="${classes.periodDuration}">
              (${t.periodDuration}: ${formatPeriodDuration(plugin.$harborConfig.period)})
            </span>
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
  const selectPeriod = $c(classes.selectPeriod) as HTMLDivElement;
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
  } = {
    max: 0,
    periods: [],
  };
  const updateRangeInTrack = () => {
    const { max, periods } = periodInfoRef;
    const left = +minThumb.value / max;
    const right = 1 - +maxThumb.value / max;
    range.style.setProperty('--left', `${(left * 100).toFixed(3)}%`);
    range.style.setProperty('--right', `${(right * 100).toFixed(3)}%`);

    const minText = periods[+minThumb.value]?.time.toLocaleTimeString();
    const maxText = periods[+maxThumb.value]?.time.toLocaleTimeString();
    range.style.setProperty('--min-text', `"${minText}"`);
    range.style.setProperty('--max-text', `"${maxText}"`);
  };

  const refreshPeriods = () => {
    const periods = plugin.harbor.getPeriodList();

    const len = periods.length;
    const max = String(len - 1);
    minThumb.max = max;
    minThumb.value = '0';

    maxThumb.max = max;
    maxThumb.value = max;
    if (len >= 3) {
      selectPeriod.classList.remove(classes.disabled);
      minThumb.disabled = false;
      maxThumb.disabled = false;
      uploadPeriodsButton.disabled = false;
      downloadPeriodsButton.disabled = false;

      periodInfoRef.max = len - 1;
      periodInfoRef.periods = periods;
      updateRangeInTrack();
    } else {
      selectPeriod.classList.add(classes.disabled);
      minThumb.disabled = true;
      maxThumb.disabled = true;
      uploadPeriodsButton.disabled = true;
      downloadPeriodsButton.disabled = true;
    }
  };

  refreshButton.addEventListener('click', () => {
    refreshButton.disabled = true;
    refreshPeriods();
    toast.message(t.refreshed);
    refreshButton.disabled = false;
  });
  minThumb.addEventListener('input', function () {
    const max = +maxThumb.value - 1;
    const current = +this.value;
    if (current > max) {
      minThumb.value = String(max);
      return;
    }
    updateRangeInTrack();
  });
  maxThumb.addEventListener('input', function () {
    const min = +minThumb.value + 1;
    const current = +this.value;
    if (current < min) {
      maxThumb.value = String(min);
      return;
    }
    updateRangeInTrack();
  });
  uploadAllButton.addEventListener('click', async () => {
    try {
      uploadAllButton.disabled = true;
      const debugUrl = await plugin.onOfflineLog('upload', {
        clearCache: false,
        remark: remark.value,
      });
      const ok = copyInBrowser(debugUrl);
      psLog.info(`${t.success}: ${debugUrl}`);
      toast.message(ok ? t.copied : t.success);
    } catch (e) {
      psLog.error(e);
      toast.message(t.fail);
    } finally {
      uploadAllButton.disabled = false;
    }
  });
  downloadAllButton.addEventListener('click', async () => {
    try {
      downloadAllButton.disabled = true;
      // await plugin.onOfflineLog('download', false);
      await plugin.onOfflineLog('download', { clearCache: false });
      toast.message(t.success);
    } catch (e) {
      psLog.error(e);
      toast.message(t.fail);
    } finally {
      downloadAllButton.disabled = false;
    }
  });
  uploadPeriodsButton.addEventListener('click', async () => {
    try {
      uploadPeriodsButton.disabled = true;
      const from = periodInfoRef.periods[+minThumb.value];
      const to = periodInfoRef.periods[+maxThumb.value];
      const debugUrl = await plugin.onOfflineLog('upload-periods', {
        from,
        to,
        remark: remark.value,
      });

      const ok = copyInBrowser(debugUrl);
      psLog.info(`${t.success}: ${debugUrl}`);
      toast.message(ok ? t.copied : t.success);
    } catch (e) {
      psLog.error(e);
      toast.message(t.fail);
    } finally {
      uploadPeriodsButton.disabled = false;
    }
  });
  downloadPeriodsButton.addEventListener('click', async () => {
    try {
      downloadPeriodsButton.disabled = true;
      const from = periodInfoRef.periods[+minThumb.value];
      const to = periodInfoRef.periods[+maxThumb.value];
      await plugin.onOfflineLog('download-periods', {
        from,
        to,
      });
      toast.message(t.success);
    } catch (e) {
      psLog.error(e);
      toast.message(t.fail);
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
