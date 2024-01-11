/**
 * Show notification use `Toast.message('Copied')`
 * Clear all notifications use `Toast.destroy()`
 */
export class Toast {
  private static timer: ReturnType<typeof setTimeout> | null = null;

  static message(text: string) {
    const node = document.createElement('div');
    node.classList.add('page-spy-toast');
    node.innerText = String(text);
    document.documentElement.appendChild(node);
    const timer = setTimeout(() => {
      if (document.contains(node)) {
        document.documentElement.removeChild(node);
      }
      if (Toast.timer === timer) {
        Toast.timer = null;
      }
    }, 1500);
    Toast.timer = timer;
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
