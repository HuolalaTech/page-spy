import classes from '../styles/toast.module.less';
import successSvg from '../assets/success.svg?raw';
import errorSvg from '../assets/error.svg?raw';

const toastIconMap = {
  success: successSvg,
  error: errorSvg,
};

type ToastType = 'success' | 'error';
/**
 * Show notification use `Toast.message('Copied')`
 * Clear all notifications use `Toast.destroy()`
 */
export class Toast {
  public static timer: ReturnType<typeof setTimeout> | null = null;

  static message(text: string | Element) {
    let node = text;
    if (typeof node === 'string') {
      node = document.createElement('div');
      node.textContent = String(text);
    }
    node.classList.add(classes.toast);
    document.documentElement.appendChild(node);
    setTimeout(() => {
      node.classList.add(classes.show);
    }, 0);
    const timer = setTimeout(() => {
      if (document.contains(node)) {
        document.documentElement.removeChild(node);
      }
      if (Toast.timer === timer) {
        Toast.timer = null;
      }
    }, 3000);
    Toast.timer = timer;
  }

  static show(type: ToastType, text: string) {
    const icon = toastIconMap[type];
    const doc = new DOMParser().parseFromString(
      `
      <div class="${classes.withIcon}">
        ${icon}
        <div>${text}</div>
      </div>`,
      'text/html',
    );
    const node = doc.querySelector(`.${classes.withIcon}`)!;
    Toast.message(node);
  }

  static destroy() {
    const nodes = document.querySelectorAll('.page-spy-toast');
    if (nodes.length) {
      [...nodes].forEach((n) => {
        if (document.contains(n)) {
          document.documentElement.removeChild(n);
        }
      });

      if (Toast.timer) {
        clearTimeout(Toast.timer);
      }
    }
    Toast.timer = null;
  }
}
