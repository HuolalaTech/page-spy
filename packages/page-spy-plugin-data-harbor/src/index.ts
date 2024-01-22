import {
  OnInitParams,
  OnMountedParams,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types';
import { PUBLIC_DATA } from 'base/src/message/debug-type';
import { isCN, isNumber, isString } from 'base/src';
import { Harbor, SaveAs } from './harbor';

interface DataHarborConfig {
  maximum?: number;
  saveAs?: SaveAs;
}

export default class DataHarborPlugin implements PageSpyPlugin {
  public name = 'DataHarborPlugin';

  // "Harbor" is an abstraction for scheduling data actions.
  private harbor: Harbor;

  // Specify the place to save data.
  private saveAs: SaveAs = 'indexedDB';

  // Specify the maximum number of data entries for caching.
  private maximum = 5000;

  public static hasInited = false;

  public static hasMounted = false;

  constructor(config: DataHarborConfig = {}) {
    if (isNumber(config.maximum)) {
      this.maximum = config.maximum;
    }
    if (isString(config.saveAs)) {
      this.saveAs = config.saveAs;
    }
    this.harbor = new Harbor({ saveAs: this.saveAs });
  }

  public onInit({ socketStore }: OnInitParams) {
    if (DataHarborPlugin.hasInited) return;
    DataHarborPlugin.hasInited = true;

    socketStore.addListener(PUBLIC_DATA, async (message) => {
      const { data, type } = message;
      const timestamp = Date.now();
      const key = (await this.harbor.container.add({
        data,
        type,
        timestamp,
      })) as number;
      if (key > this.maximum) {
        await this.harbor.container.clear();
      }
    });
    window.addEventListener('beforeunload', async () => {
      await this.harbor.container.drop();
    });
  }

  public onMounted({ content }: OnMountedParams) {
    if (DataHarborPlugin.hasMounted) return;
    DataHarborPlugin.hasMounted = true;

    const div = document.createElement('div');
    div.id = 'data-harbor-plugin-download';
    div.className = 'page-spy-content__btn';
    div.textContent = isCN() ? '下载日志数据' : 'Download the data';

    div.addEventListener('click', async () => {
      const data = await this.harbor.container.getAll();
      const blob = new Blob([JSON.stringify(data)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.download = `${new Date().toLocaleString()}.json`;
      a.href = url;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    content.insertAdjacentElement('beforeend', div);
  }

  onReset() {
    DataHarborPlugin.hasInited = false;
    DataHarborPlugin.hasMounted = false;
    const node = document.getElementById('data-harbor-plugin-download');
    if (node) {
      node.remove();
    }
  }
}
