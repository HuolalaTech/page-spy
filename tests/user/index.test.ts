// 用户视角测试什么：
// - new PageSpy() 实例化后会加载一个控件
// - 控件可以拖动
// - 控件可以点击，点击后出现弹窗
// - 弹窗上显示连接的基本信息，有复制按钮
// - 点击复制按钮，可以将调试地址的链接复制下来

import SDK from 'src/index';
import { screen, waitFor } from '@testing-library/dom';

describe('Render PageSpy', () => {
  it('Root element and logo', async () => {
    const sdk = new SDK();
    sdk.render();

    await waitFor(() => {
      expect(screen.getByAltText(/pagespy logo/i)).toBeInTheDocument();
    });
  });
});
