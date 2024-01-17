/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  OnInitParams,
  OnMountedParams,
  PageSpyPlugin,
} from '@huolala-tech/page-spy-types';
import { PUBLIC_DATA } from 'base/src/message/debug-type';
import { isCN } from 'base/src';
import Harbor from './harbor';

export default class DataHarborPlugin implements PageSpyPlugin {
  private harbor = new Harbor();

  public name = 'DataHarborPlugin';

  public static hasInited = false;

  public onInit({ socketStore }: OnInitParams) {
    socketStore.addListener(PUBLIC_DATA, async (message) => {
      const { data, type } = message;
      this.harbor.add({
        data,
        type,
      });
    });
  }

  public onMounted({ content }: OnMountedParams) {
    const div = document.createElement('div');
    div.className = 'page-spy-content__btn';
    div.textContent = isCN() ? '下载离线数据' : 'Download the data';

    div.addEventListener('click', async () => {
      const data = await this.harbor.getAll();
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
}
