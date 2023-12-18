/**
 * Show notification use `Toast.message('Copied')`
 * Clear all notifications use `Toast.destroy()`
 */
export class Toast {
  private static timer: number | null = null;

  static message(text: string) {
    const node = document.createElement('div');
    node.classList.add('page-spy-toast');
    node.textContent = String(text);
    document.documentElement.appendChild(node);
    Toast.timer = window.setTimeout(() => {
      if (node) {
        document.documentElement.removeChild(node);
      }
      Toast.timer = null;
    }, 1500);
  }

  static destroy() {
    const nodes = document.querySelectorAll('.page-spy-toast');
    if (nodes.length) {
      [...nodes].forEach((n) => {
        if (n) {
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
