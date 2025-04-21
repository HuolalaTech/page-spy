import { pasteboard } from '@kit.BasicServicesKit';
import { promptAction } from '@kit.ArkUI';

export function copy(text: string) {
  const pasteboardData = pasteboard.createData(
    pasteboard.MIMETYPE_TEXT_PLAIN,
    text,
  );
  const systemPasteboard = pasteboard.getSystemPasteboard();
  systemPasteboard.setData(pasteboardData).then(
    () => {
      promptAction.showToast({ message: '复制成功' });
    },
    () => {
      promptAction.showToast({ message: '复制失败' });
    },
  );
}
