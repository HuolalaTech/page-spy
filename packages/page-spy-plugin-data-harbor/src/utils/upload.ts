import { isCN, psLog, removeEndSlash } from 'base/src';
import type { Harbor } from '../harbor';
import { UPLOAD_TIPS } from './TIP_CONTENT';
import { formatFilename } from '.';

const lang = isCN() ? 'zh' : 'en';
const TIPS = UPLOAD_TIPS[lang];

export type UploadArgs = {
  harbor: Harbor;
  filename: () => string;
  uploadUrl: string;
  debugClient: string;
  tags?: Partial<{
    project: string;
    title: string;
    deviceId: string;
    userAgent: string;
  }>;
};

export const startUpload = async ({
  harbor,
  filename,
  uploadUrl,
  debugClient,
  tags = {},
}: UploadArgs) => {
  const uploadBtn: HTMLDivElement | null = document.querySelector(
    '#data-harbor-plugin-upload',
  );

  const data = await harbor.getHarborData();
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json',
  });
  const file = new File([blob], `${formatFilename(filename())}.json`, {
    type: 'application/json',
  });
  const form = new FormData();
  form.append('log', file);

  if (uploadBtn) {
    uploadBtn.textContent = TIPS.uploading;
  }

  const response = await fetch(
    `${uploadUrl}/api/v1/log/upload?${new URLSearchParams(tags).toString()}`,
    {
      method: 'POST',
      body: form,
    },
  );
  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const result: H.UploadResult = await response.json();
  if (!result.success) {
    throw new Error(result.message);
  }
  const uploadUrlWithoutSlash = removeEndSlash(uploadUrl);
  const onlineLogUrl = `${uploadUrlWithoutSlash}/api/v1/log/download?fileId=${result.data.fileId}`;

  const debugClientWithoutSlash = removeEndSlash(debugClient);
  const debugUrl = `${debugClientWithoutSlash}/#/replay?url=${onlineLogUrl}`;

  psLog.info(`${TIPS.success}: ${debugUrl}`);

  return debugUrl;
};

export const handleUpload = ({
  harbor,
  filename,
  uploadUrl,
  debugClient,
  tags,
}: UploadArgs) => {
  const uploadBtn = document.createElement('div');
  uploadBtn.id = 'data-harbor-plugin-upload';
  uploadBtn.className = 'page-spy-content__btn';
  uploadBtn.textContent = TIPS.normal;
  let idleWithUpload = true;

  uploadBtn.addEventListener('click', async () => {
    if (!uploadUrl) {
      uploadBtn.textContent = TIPS.invalid;
      return;
    }

    if (!idleWithUpload) return;
    idleWithUpload = false;

    try {
      uploadBtn.textContent = TIPS.readying;
      const debugUrl = await startUpload({
        harbor,
        filename,
        uploadUrl,
        debugClient,
        tags,
      });
      // Ready to copy
      const root = document.body || document.documentElement;
      const input = document.createElement('input');
      root.insertAdjacentElement('beforeend', input);
      input.value = debugUrl;
      input.select();
      const isOk = document.execCommand('copy');
      root.removeChild(input);
      if (isOk) {
        document.querySelector('#uploaded-log-url')?.remove();
        uploadBtn.textContent = TIPS.copied;
      } else {
        //  If copy failed
        let logUrlElement: HTMLDivElement | null =
          document.querySelector('#uploaded-log-url');
        if (!logUrlElement) {
          logUrlElement = document.createElement('div');
          logUrlElement.id = 'uploaded-log-url';
          logUrlElement.style.wordBreak = 'break-word';
          logUrlElement.style.padding = '12px';
          logUrlElement.style.borderTop = '1px solid #eee';
          uploadBtn.insertAdjacentElement('afterend', logUrlElement);
        }
        const tipPrefix = TIPS.copyTip;
        logUrlElement.textContent = tipPrefix + debugUrl;
        uploadBtn.textContent = TIPS.success;
      }
    } catch (e: any) {
      uploadBtn.textContent = TIPS.fail;
      psLog.error(e.message);
    } finally {
      setTimeout(() => {
        uploadBtn.textContent = TIPS.normal;
        idleWithUpload = true;
      }, 1500);
    }
  });

  return uploadBtn;
};
