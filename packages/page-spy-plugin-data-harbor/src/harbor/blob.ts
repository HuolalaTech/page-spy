import { isBrowser, isNumber } from '@huolala-tech/page-spy-base';

interface HarborConfig {
  maximum?: number;
}

let currentContainerSize = 0;

export class BlobHarbor {
  // Object URL list
  stock: string[] = [];

  container: any[] = [];

  // Specify the maximum bytes of single harbor's container.
  // 0 means no limitation.
  maximum = 0;

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

  public add(data: any) {
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
