import { psLog } from '@huolala-tech/page-spy-base/dist/utils';
import { getMPSDK } from '.';

export type UploadArgs = {
  url: string;
  data: any;
};

export const saveData = async ({ url, data }: UploadArgs) => {
  return new Promise<H.UploadResult>((resolve, reject) => {
    const mp = getMPSDK();
    mp.request({
      data,
      url,
      method: 'POST',
      success: (res: any) => {
        if (res.statusCode === 200) {
          const data = res.data;
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
