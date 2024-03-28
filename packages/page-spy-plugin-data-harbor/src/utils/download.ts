import { isCN, psLog } from 'base/src';
import type { Harbor } from '../harbor';
import type { CacheMessageItem } from '../index';
import { DOWNLOAD_TIPS } from './TIP_CONTENT';
import { formatFilename } from '.';

const lang = isCN() ? 'zh' : 'en';
const TIPS = DOWNLOAD_TIPS[lang];

export type DownloadArgs = {
  harbor: Harbor;
  customDownload?: (data: CacheMessageItem[]) => void;
  filename: () => string;
};

export const startDownload = async ({
  harbor,
  filename,
  customDownload,
}: DownloadArgs) => {
  const downloadBtn: HTMLDivElement | null = document.querySelector(
    '#data-harbor-plugin-download',
  );
  const data = await harbor.getHarborData();
  if (customDownload) {
    if (downloadBtn) {
      downloadBtn.textContent = TIPS.ready;
    }
    await customDownload(data);
    return;
  }
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json',
  });
  const root: HTMLElement =
    document.getElementsByTagName('body')[0] || document.documentElement;
  if (!root) {
    psLog.error(
      'Download file failed because cannot find the document.body & document.documentElement',
    );
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = `${formatFilename(filename())}.json`;
  a.href = url;
  a.style.display = 'none';
  root.insertAdjacentElement('beforeend', a);
  a.click();

  root.removeChild(a);
  URL.revokeObjectURL(url);

  psLog.info(`${TIPS.success}`);
};

export const handleDownload = ({
  harbor,
  filename,
  customDownload,
}: DownloadArgs) => {
  const downloadBtn = document.createElement('div');
  downloadBtn.id = 'data-harbor-plugin-download';
  downloadBtn.className = 'page-spy-content__btn';
  downloadBtn.textContent = TIPS.normal;
  let idleWithDownload = true;

  downloadBtn.addEventListener('click', async () => {
    if (!idleWithDownload) return;
    idleWithDownload = false;

    try {
      downloadBtn.textContent = TIPS.readying;
      await startDownload({ harbor, filename, customDownload });
      downloadBtn.textContent = TIPS.success;
    } catch (e) {
      downloadBtn.textContent = TIPS.fail;
      psLog.error('Download failed.', e);
    } finally {
      setTimeout(() => {
        downloadBtn.textContent = TIPS.normal;
        idleWithDownload = true;
      }, 1500);
    }
  });

  return downloadBtn;
};
