import classes from '../assets/styles/toast.module.less';
import { nodeId as ROOT_ID } from '../config';

const successSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
  <path fill="currentColor" fill-rule="evenodd"
    d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10m-1.177-7.86l-2.765-2.767L7 12.431l3.119 3.121a1 1 0 0 0 1.414 0l5.952-5.95l-1.062-1.062z" />
</svg>`;

const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
  <path fill="currentColor"
    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m1 15h-2v-2h2zm0-4h-2V7h2z" />
</svg>`;

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
  private static timer: ReturnType<typeof setTimeout> | null = null;

  private static get root() {
    return document.querySelector(`#${ROOT_ID}`);
  }

  static message(text: string | Element) {
    if (!Toast.root) return;

    let node = text;
    if (typeof node === 'string') {
      node = document.createElement('div');
      node.textContent = String(text);
    }
    node.classList.add('page-spy-toast', classes.toast);
    Toast.root.appendChild(node);
    setTimeout(() => {
      node.classList.add(classes.show);
    }, 0);
    const timer = setTimeout(() => {
      node?.remove();
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
        n.remove();
      });

      if (Toast.timer) {
        clearTimeout(Toast.timer);
      }
    }
    Toast.timer = null;
  }
}
