import { psLog } from '@huolala-tech/page-spy-base';
import { formatFilename } from '.';
import { CacheMessageItem } from '../harbor/base';
import { t } from '../assets/locale';

export type DownloadArgs = {
  data: any;
  customDownload?: (data: CacheMessageItem[]) => void;
  filename: () => string;
};

export const startDownload = async ({
  data,
  filename,
  customDownload,
}: DownloadArgs) => {
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

  psLog.info(`${t.success}`);
};

export const buttonBindWithDownload = (fn: () => Promise<void>) => {
  const downloadBtn = document.createElement('div');
  downloadBtn.id = 'data-harbor-plugin-download';
  downloadBtn.className = 'page-spy-content__btn';
  downloadBtn.textContent = t.downloadAll;
  let idleWithDownload = true;

  downloadBtn.addEventListener('click', async () => {
    if (!idleWithDownload) return;
    idleWithDownload = false;

    try {
      downloadBtn.textContent = t.readying;
      await fn();
      downloadBtn.textContent = t.success;
    } catch (e: any) {
      downloadBtn.textContent = t.fail;
      psLog.error('Download failed.', e.message);
    } finally {
      setTimeout(() => {
        downloadBtn.textContent = t.downloadAll;
        idleWithDownload = true;
      }, 1500);
    }
  });

  return downloadBtn;
};
