import classes from '../assets/styles/toast.module.less';
import { nodeId } from '../config';

/**
 * Show notification use `Toast.message('Copied')`
 * Clear all notifications use `Toast.destroy()`
 */
export class Toast {
  public static timer: ReturnType<typeof setTimeout> | null = null;

  private static get root() {
    return document.querySelector(`#${nodeId}`) ?? document.body;
  }

  static message(text: string) {
    const node = document.createElement('div');
    node.classList.add('page-spy-toast', classes.toast);
    node.innerText = String(text);
    Toast.root.appendChild(node);
    const timer = setTimeout(() => {
      if (Toast.root.contains(node)) {
        Toast.root.removeChild(node);
      }
      if (Toast.timer === timer) {
        Toast.timer = null;
      }
    }, 3000);
    Toast.timer = timer;
  }

  static destroy() {
    const nodes = Toast.root.querySelectorAll('.page-spy-toast');
    if (nodes.length) {
      [...nodes].forEach((n) => {
        if (Toast.root.contains(n)) {
          Toast.root.removeChild(n);
        }
      });

      if (Toast.timer) {
        clearTimeout(Toast.timer);
      }
    }
    Toast.timer = null;
  }
}
