type DataType = 'console' | 'network' | 'rrweb-event';

interface DataHarborConfig {
  // Specify the maximum bytes of single harbor's container.
  // Default 10 * 1024 * 1024.
  maximum?: number;

  // Specify which types of data to collect.
  caredData?: Record<DataType, boolean>;

  // Customize the "Download Log Data"
  // (Version required: @huolala-tech/page-spy-plugin-data-harbor^1.0.6)
  onDownload?: (data: CacheMessageItem[]) => void;
}

declare class DataHarborPlugin {
  constructor(config?: DataHarborConfig);
}

export default DataHarborPlugin;
