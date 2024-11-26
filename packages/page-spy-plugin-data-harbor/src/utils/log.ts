import { psLog } from '@huolala-tech/page-spy-base/dist/utils';
import { CacheMessageItem } from '../harbor/base';
import { t } from '../assets/locale';
import { formatFilename } from './index';

export type UploadArgs = {
  url: string;
  body?: FormData;
};

export type DownloadArgs = {
  data: any;
  customDownload?: (data: CacheMessageItem[]) => void;
  filename: () => string;
};

export const startUpload = async ({ url, body }: UploadArgs) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body,
    });
    if (!response.ok) {
      psLog.warn('Upload failed');
      return null;
    }

    const result: H.UploadResult = await response.json();
    if (!result.success) {
      psLog.warn(result.message);
      return null;
    }

    return result;
  } catch (e: any) {
    psLog.error(e.message);
    return null;
  }
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
