import { psLog } from '@huolala-tech/page-spy-base';
import type { Harbor } from '../harbor';
import type { CacheMessageItem } from '../index';
import { DOWNLOAD_TIPS } from './TIP_CONTENT';
import { formatFilename } from '.';

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
  const data = await harbor.getHarborData();
  if (customDownload) {
    await customDownload(data);
    return;
  }
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json',
  });
  const root: HTMLElement =
    document.getElementsByTagName('body')[0] || document.documentElement;
  if (!root) {
    throw new Error(
      'Download file failed because cannot find the document.body & document.documentElement',
    );
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

  psLog.info(`${DOWNLOAD_TIPS.success}`);
};

export const buttonBindWithDownload = (fn: () => Promise<void>) => {
  const downloadBtn = document.createElement('div');
  downloadBtn.id = 'data-harbor-plugin-download';
  downloadBtn.className = 'page-spy-content__btn';
  downloadBtn.textContent = DOWNLOAD_TIPS.normal;
  let idleWithDownload = true;

  downloadBtn.addEventListener('click', async () => {
    if (!idleWithDownload) return;
    idleWithDownload = false;

    try {
      downloadBtn.textContent = DOWNLOAD_TIPS.readying;
      await fn();
      downloadBtn.textContent = DOWNLOAD_TIPS.success;
    } catch (e: any) {
      downloadBtn.textContent = DOWNLOAD_TIPS.fail;
      psLog.error('Download failed.', e.message);
    } finally {
      setTimeout(() => {
        downloadBtn.textContent = DOWNLOAD_TIPS.normal;
        idleWithDownload = true;
      }, 1500);
    }
  });

  return downloadBtn;
};
