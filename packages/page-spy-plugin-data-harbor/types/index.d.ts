type DataType = 'console' | 'network' | 'rrweb-event';
type SaveAs = 'indexedDB' | 'memory';

interface DataHarborConfig {
  // Specify the maximum number of data entries for caching.
  // Default no limitation.
  maximum?: number;

  // Specify the place to save data.
  // Default using "indexedDB"
  saveAs?: SaveAs;

  // Specify which types of data to collect.
  caredData?: Record<DataType, boolean>;
}

declare class DataHarborPlugin {
  constructor(config?: DataHarborConfig);
}

export default DataHarborPlugin;
