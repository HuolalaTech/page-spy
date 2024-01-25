import { Container } from './base';
import IDBContainer from './idb-container';
import MemoryContainer from './memory-container';

const CONTAINER_SAVE_AS = [
  {
    saveAs: 'memory',
    container: MemoryContainer,
  },
  {
    saveAs: 'indexedDB',
    container: IDBContainer,
  },
] as const;

export type SaveAs = (typeof CONTAINER_SAVE_AS)[number]['saveAs'];

interface HarborConfig {
  saveAs: SaveAs;
}

export class Harbor {
  container: Container;

  constructor(config: HarborConfig) {
    const targetContainer = CONTAINER_SAVE_AS.find(
      (i) => i.saveAs === config.saveAs,
    );
    if (!targetContainer) {
      throw new Error(
        `[DataHarborPlugin] The "saveAs" you passed is not exist, valid value: ${CONTAINER_SAVE_AS.map(
          (i) => i.saveAs,
        )}`,
      );
    }
    // eslint-disable-next-line new-cap
    this.container = new targetContainer.container();
  }
}
