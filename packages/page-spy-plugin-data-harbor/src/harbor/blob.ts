import { isBrowser } from '@huolala-tech/page-spy-base';
import { isValidMaximum, isValidPeriod } from '../utils';

interface HarborConfig {
  maximum: number;
  period: number | null;
}

let currentContainerSize = 0;

export const PERIOD_DIVIDE_IDENTIFIER = 'PERIOD_DIVIDE_IDENTIFIER';

export class BlobHarbor {
  // Object URL list
  //
  // If add with 'maximum':
  // <stock>[
  //   <blob 0>, // the total size of each blob has been to the maximum
  //   <blob 1>,
  //   ...
  // ]
  //
  // If add with 'period':
  // <stock>[
  //   <blob 0>, // the duration of each blob equals to the period
  //   <blob 1>,
  //   ...,
  // ]
  stock: string[] = [];

  container: any[] = [];

  // Specify the maximum bytes of single harbor's container.
  // 0 means no limitation.
  maximum = 0;

  // Specify the duration of one period, unit is millisecond.
  // Minimum period is 60 * 1000, 1 minute.
  // Maximum period is 30 * 60 * 1000, 30 minutes.
  // Default null, indicates no period division.
  period: number | null = null;

  constructor(config?: HarborConfig) {
    if (isValidMaximum(config?.maximum)) {
      this.maximum = config.maximum;
    }
    if (isValidPeriod(config?.period)) {
      this.period = config.period;
    }
    if (isBrowser()) {
      window.addEventListener('beforeunload', () => {
        this.stock.forEach((i) => {
          URL.revokeObjectURL(i);
        });
      });
    }
  }

  public add(data: any) {
    return this.period ? this.addByPeriod(data) : this.addByMaximum(data);
  }

  private addByPeriod(data: any) {
    try {
      if (data === PERIOD_DIVIDE_IDENTIFIER && this.container.length) {
        const data2objectUrl = URL.createObjectURL(
          new Blob([JSON.stringify(this.container)], {
            type: 'application/json',
          }),
        );
        this.stock.push(data2objectUrl);
        this.container = [];
      } else {
        this.container.push(data);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  private addByMaximum(data: any) {
    try {
      if (this.maximum === 0) {
        this.container.push(data);
        return true;
      }

      const { size } = new Blob([JSON.stringify(data)], {
        type: 'application/json',
      });
      const newSize = currentContainerSize + size;
      if (newSize >= this.maximum) {
        const data2objectUrl = URL.createObjectURL(
          new Blob([JSON.stringify(this.container)], {
            type: 'application/json',
          }),
        );
        this.stock.push(data2objectUrl);
        this.container = [data];
        currentContainerSize = 0;
      } else {
        this.container.push(data);
        currentContainerSize = newSize;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async getAll() {
    const stockData = await Promise.all(
      this.stock.map(async (i) => {
        try {
          const res = await fetch(i);
          if (!res.ok) return null;
          return await res.json();
        } catch (e) {
          return null;
        }
      }),
    );
    const validStockData = stockData.filter(Boolean);
    if (this.period) {
      return {
        type: 'period',
        data: validStockData.concat(this.container),
      };
    }
    const combinedData = validStockData.reduce(
      (acc, cur) => acc.concat(cur),
      [],
    );
    return {
      type: 'maximum',
      data: combinedData.concat(this.container),
    };
  }

  clear() {
    this.stock.forEach((i) => URL.revokeObjectURL(i));
    this.stock = [];
    this.container = [];
  }
}
