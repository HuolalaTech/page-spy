import { isCN } from '@huolala-tech/page-spy-base';

const source = {
  zh: {
    title: '离线日志',
    download: '下载',
    upload: '上传',
    readying: '准备数据...',
    ready: '数据已就绪',
    success: '处理成功',
    fail: '处理失败',
    invalid: '无法上传',
    copied: '已复制调试连接',
  },
  en: {
    title: 'Offline log',
    download: 'Download',
    upload: 'Upload',
    readying: 'Handling...',
    ready: 'Ready',
    success: 'Succeed',
    fail: 'Failed',
    invalid: 'Cannot upload',
    copied: 'Copied',
  },
};

export const t = isCN() ? source.zh : source.en;
