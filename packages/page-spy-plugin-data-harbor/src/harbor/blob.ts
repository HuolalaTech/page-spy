import { isBrowser, isNumber } from '@huolala-tech/page-spy-base';
import { isValidMaximum } from '../utils';

interface HarborConfig {
  maximum: number;
}

interface PeriodList {
  stable: PeriodItem[];
  active: PeriodItem[];
}

export interface PeriodItem {
  time: Date;
  stockIndex: number | null;
  // Divide from which index in a stock/container.
  dataIndex: number;
}

export const isPeriodItem = (data: unknown): data is PeriodItem => {
  if (!data) return false;
  return ['time', 'stockIndex', 'dataIndex'].every((key) => {
    return Object.prototype.hasOwnProperty.call(data, key);
  });
};

let currentContainerSize = 0;

export const PERIOD_DIVIDE_IDENTIFIER = 'PERIOD_DIVIDE_IDENTIFIER';
export const DEFAULT_MAXIMUM = 10 * 1024 * 1024;
export const DEFAULT_PERIOD_DURATION = 5 * 60 * 1000;

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
  maximum = DEFAULT_MAXIMUM;

  periodList: PeriodList = {
    stable: [],
    active: [],
  };

  constructor(config?: HarborConfig) {
    if (isValidMaximum(config?.maximum)) {
      this.maximum = config.maximum;
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
    const harborIsEmpty =
      this.periodList.active.length === 0 &&
      this.stock.length === 0 &&
      this.container.length === 0;

    try {
      if (harborIsEmpty || data === PERIOD_DIVIDE_IDENTIFIER) {
        this.periodList.active.push({
          time: new Date(),
          stockIndex: null,
          dataIndex: this.container.length,
        });
        return true;
      }
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
        this.flushActivePeriod();
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

  private flushActivePeriod() {
    const activeToStable = this.periodList.active.map((i) => ({
      ...i,
      stockIndex: this.stock.length - 1,
    }));
    this.periodList.stable.push(...activeToStable);
    this.periodList.active = [];
  }

  // Periods can only be made if the length >= 3
  // Because the head and tail will be filled with one each
  getPeriodList() {
    const temp: PeriodItem = {
      time: new Date(),
      stockIndex: null,
      dataIndex: this.container.length,
    };
    return [...this.periodList.stable, ...this.periodList.active, temp];
  }

  async getPeriodData(from: PeriodItem, to: PeriodItem) {
    const { stockIndex: fStock, dataIndex: fData } = from;
    const { stockIndex: tStock, dataIndex: tData } = to;

    // all data in container
    if (fStock === null && tStock === null) {
      return this.container.slice(fData, tData);
    }
    if (fStock === null || !isNumber(fStock)) {
      throw new Error('The start of selected period is invalid');
    }
    // <stock> [
    //   <blob>, <- fStock,
    //   ...,
    //   <blob> <- tStock, maybe null
    // ]
    // both fStock and tStock are in stock
    const stockData = (
      await Promise.all(
        this.stock.map(async (url, index) => {
          try {
            if (index < fStock || (isNumber(tStock) && index > tStock)) {
              return null;
            }

            const res = await fetch(url);
            if (!res.ok) return null;

            const data = await res.json();
            if (index === fStock) {
              if (index === tStock) {
                return data.slice(fData, tData);
              }
              return data.slice(fData);
            }
            if (index === tStock) {
              return data.slice(0, tData);
            }
            return data;
          } catch (e) {
            return null;
          }
        }),
      )
    ).reduce((acc, cur) => {
      if (!cur) return acc;
      return acc.concat(cur);
    }, []);

    // tStock in container
    if (!isNumber(tStock)) {
      return stockData.concat(this.container.slice(0, tData));
    }

    return stockData;
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
    const combinedData = validStockData.reduce(
      (acc, cur) => acc.concat(cur),
      [],
    );
    return combinedData.concat(this.container);
  }

  clear() {
    this.stock.forEach((i) => URL.revokeObjectURL(i));
    this.stock = [];
    this.container = [];
    this.periodList = {
      stable: [],
      active: [],
    };
  }
}
