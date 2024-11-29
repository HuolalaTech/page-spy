import { psLog } from '@huolala-tech/page-spy-base/dist/utils';
import { getMPSDK } from '@huolala-tech/page-spy-mp-base';

export type UploadArgs = {
  url: string;
  path: string;
};

declare var uni: any;

export const startUpload = async ({ url, path }: UploadArgs) => {
  return new Promise<H.UploadResult>((resolve, reject) => {
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
};
