interface ModalParams {
  className?: string;
  el?: string;
}

export class Modal {
  el: HTMLElement;

  constructor(args: ModalParams = {}) {
    const { className = '', el = 'div' } = args;
    const modal = document.createElement(el);
    modal.dataset.testid = 'modal';
    modal.className = ['page-spy-modal', className].join(' ');
    modal.style.display = 'none';
    /* c8 ignore next 4 */
    modal.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.close();
    };
    this.el = modal;
  }

  show() {
    this.el.style.display = 'flex';
    /* c8 ignore next 3 */
    setTimeout(() => {
      this.el.classList.add('show');
    }, 50);
  }

  close() {
    this.el.classList.remove('show');
    /* c8 ignore next 3 */
    setTimeout(() => {
      this.el.style.display = 'none';
    }, 300);
  }

  append(node: HTMLElement) {
    this.el.appendChild(node);
  }
}
