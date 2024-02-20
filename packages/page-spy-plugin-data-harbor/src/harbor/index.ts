import { isBrowser, isNumber } from 'base/src';

interface HarborConfig {
  maximum?: number;
}

let currentContainerSize = 0;

export class Harbor {
  // Object URL list
  stock: string[] = [];

  container: any[] = [];

  // Specify the maximum bytes of single harbor's container.
  // Default 10MB.
  private maximum = 10 * 1024 * 1024;

  constructor(config?: HarborConfig) {
    if (config && isNumber(config.maximum) && config.maximum >= 0) {
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

  public save(data: any) {
    try {
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

  async getHarborData() {
    const stockData = await Promise.all(
      this.stock.map(async (i) => {
        try {
          const res = await fetch(i);
          if (!res.ok) return null;
          const data = JSON.parse(await res.text());
          return data;
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
  }
}
