import { isCN } from '@huolala-tech/page-spy-base';

const source = {
  zh: {
    title: '离线日志',
    uploadAll: '上传全量',
    downloadAll: '下载全量',
    uploadPeriods: '上传时间段',
    downloadPeriods: '下载时间段',
    readying: '准备数据...',
    ready: '数据已就绪',
    success: '处理成功',
    fail: '处理失败',
    invalid: '无法上传',
    copied: '已复制调试连接',
    selectPeriod: '选择时间段',
    remark: '备注',
    remarkPlaceholder: '上传后，可以看到备注信息',
    periodFrom: '从',
    periodTo: '到',
  },
  en: {
    title: 'Offline log',
    uploadAll: 'Upload All',
    downloadAll: 'Download All',
    uploadPeriods: 'Upload Periods',
    downloadPeriods: 'Download Periods',
    readying: 'Handling...',
    ready: 'Ready',
    success: 'Succeed',
    fail: 'Failed',
    invalid: 'Cannot upload',
    copied: 'Copied',
    selectPeriod: 'Select period',
    remark: 'Remark',
    remarkPlaceholder: 'After uploading, you can view the remark information.',
    periodFrom: 'From',
    periodTo: 'To',
  },
};

export const t = isCN() ? source.zh : source.en;