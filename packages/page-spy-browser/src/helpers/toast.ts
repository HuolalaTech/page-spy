import classes from '../assets/styles/toast.module.less';
import { nodeId } from '../config';

/**
 * Show notification use `toast.message('Copied')`
 * Clear all notifications use `toast.destroy()`
 */
export class toast {
  constructor() {
    if (new.target === toast) {
      throw new Error('Cannot call `new toast()`');
    }
  }

  private static timer: ReturnType<typeof setTimeout> | null = null;

  private static get root() {
    return document.querySelector(`#${nodeId}`) ?? document.body;
  }

  public static message(text: string) {
    const node = document.createElement('div');
    node.classList.add('page-spy-toast', classes.toast);
    node.innerText = String(text);
    toast.root.appendChild(node);
    const timer = setTimeout(() => {
      if (toast.root.contains(node)) {
        toast.root.removeChild(node);
      }
      if (toast.timer === timer) {
        toast.timer = null;
      }
    }, 3000);
    toast.timer = timer;
  }

  public static destroy() {
    const nodes = toast.root.querySelectorAll('.page-spy-toast');
    if (nodes.length) {
      [...nodes].forEach((n) => {
        if (toast.root.contains(n)) {
          toast.root.removeChild(n);
        }
      });

      if (toast.timer) {
        clearTimeout(toast.timer);
      }
    }
    toast.timer = null;
  }
}
