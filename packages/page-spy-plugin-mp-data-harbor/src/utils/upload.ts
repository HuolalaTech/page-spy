import { psLog } from '@huolala-tech/page-spy-base';
import { getMPSDK } from '@huolala-tech/page-spy-mp-base';

export type UploadArgs = {
  url: string;
  path: string;
};

declare var uni: any;

export const startUpload = async ({ url, path }: UploadArgs) => {
  return new Promise((resolve, reject) => {
    const mp = getMPSDK();
    mp.uploadFile({
      filePath: path,
      header: {
        'Content-Type': 'multipart/form-data',
      },
      name: 'log',
      url,
      success: (res: any) => {
        if (res.statusCode === 200) {
          const data = JSON.parse(res.data);
          if (data.success) {
            resolve(data);
          } else {
            reject(data);
          }
        }
      },
      fail: (err: any) => {
        psLog.warn('Upload failed', err);
        reject(err);
      },
    });
  });
  // try {
  //   const res = mp.uploadFile
  //   const response = await fetch(url, {
  //     method: 'POST',
  //     body,
  //   });
  //   if (!response.ok) {
  //     psLog.warn('Upload failed');
  //     return null;
  //   }

  //   const result: H.UploadResult = await response.json();
  //   if (!result.success) {
  //     psLog.warn(result.message);
  //     return null;
  //   }

  //   return result;
  // } catch (e: any) {
  //   psLog.error(e.message);
  //   return null;
  // }
};
