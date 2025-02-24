import { isCN } from '@huolala-tech/page-spy-base';

const source = {
  zh: {
    selectPeriod: '选择时间段',
    title: '离线日志',
    readying: '处理中...',
    ready: '数据已就绪',
    success: '处理成功',
    fail: '处理失败',
    copied: '已复制调试连接',
    remark: '备注',
    remarkPlaceholder: '回放时可以看到备注信息',
    from: '从',
    to: '到',
    refreshed: '已刷新',
    minutes: '分钟',
    eventCountNotEnough: '时间段内的数据量不足以回放',
    export: '导出日志',
  },
  en: {
    selectPeriod: 'Select period',
    title: 'Offline log',
    readying: 'Handling...',
    ready: 'Ready',
    success: 'Succeed',
    fail: 'Failed',
    copied: 'Replay url copied',
    remark: 'Remark',
    remarkPlaceholder: 'The remark will be displayed during replay',
    from: 'From',
    to: 'To',
    refreshed: 'Refreshed',
    minutes: 'minutes',
    eventCountNotEnough:
      'The data within the time period is insufficient for playback',
    export: 'Export log',
  },
};

export const t = isCN() ? source.zh : source.en;
