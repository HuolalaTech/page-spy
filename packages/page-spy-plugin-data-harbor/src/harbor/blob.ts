import { isBrowser, isNumber } from '@huolala-tech/page-spy-base/dist/utils';
import { isValidMaximum } from '../utils';
import { CacheMessageItem, PeriodActionParams, PeriodItem } from './base';
import { t } from '../assets/locale';

interface HarborConfig {
  maximum: number;
}

interface PeriodList {
  stable: PeriodItem[];
  active: PeriodItem[];
}

let currentContainerSize = 0;

export const PERIOD_DIVIDE_IDENTIFIER = 'PERIOD_DIVIDE_IDENTIFIER';
export const DEFAULT_MAXIMUM = 10 * 1024 * 1024;

export class BlobHarbor {
  // Object URL list
  stock: string[] = [];

  container: CacheMessageItem[] = [];

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
    const dataIsPeriod = data === PERIOD_DIVIDE_IDENTIFIER;

    try {
      if (harborIsEmpty || dataIsPeriod) {
        this.periodList.active.push({
          time: new Date(),
          stockIndex: null,
          dataIndex: this.container.length,
        });
        if (dataIsPeriod) return true;
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

  // There are at least two periods since we manually inserted them both at the head and at the tail
  getPeriodList() {
    const temp: PeriodItem = {
      time: new Date(),
      stockIndex: null,
      dataIndex: this.container.length,
    };
    return [...this.periodList.stable, ...this.periodList.active, temp];
  }

  async getPeriodData(params: PeriodActionParams) {
    const { head, tail } = this.getHeadAndTailPeriods(params);
    const { endTime } = params;

    const { stockIndex: fStock, dataIndex: fData } = head || {};
    const { stockIndex: tStock, dataIndex: tData } = tail || {};

    let result: CacheMessageItem[] = [];

    // all data in container
    if (!fStock && !tStock) {
      result = this.container.slice(fData, tData);
    } else {
      if (!fStock || !isNumber(fStock)) {
        throw new Error(t.invalidPeriods);
      }

      // <stock> [
      //   <blob>, <- fStock,
      //   ...,
      //   <blob> <- tStock, maybe null
      // ]
      // both fStock and tStock are in stock
      result = (
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

      // tStock in container, its value is null
      if (!isNumber(tStock)) {
        result = result.concat(this.container.slice(0, tData));
      }
    }

    return result.filter((i) => i.timestamp <= endTime);
  }

  private getHeadAndTailPeriods({
    startTime,
    endTime,
  }: {
    startTime: number;
    endTime: number;
  }) {
    const periods = this.getPeriodList();
    const head = periods.findLast((i) => i.time.getTime() <= startTime);
    const tail = periods.find((i) => i.time.getTime() >= endTime);

    return { head, tail };
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
    const validStockData = stockData.filter(
      Boolean,
    ) as NonNullable<CacheMessageItem>[];
    const combinedData = validStockData.reduce(
      (acc, cur) => acc.concat(cur),
      [] as CacheMessageItem[],
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
