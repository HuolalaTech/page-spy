interface ModalParams {
  className?: string;
  el?: string;
}

export class Modal {
  el: HTMLElement;

  constructor(args: ModalParams = {}) {
    const { className = '', el = 'div' } = args;
    const modal = document.createElement(el);
    modal.className = ['page-spy-modal', className].join(' ');
    modal.style.display = 'none';
    modal.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.close();
    };
    this.el = modal;
  }

  show() {
    this.el.style.display = 'flex';
    setTimeout(() => {
      this.el.classList.add('show');
    }, 50);
  }

  close() {
    this.el.classList.remove('show');
    setTimeout(() => {
      this.el.style.display = 'none';
    }, 300);
  }

  append(node: HTMLElement) {
    this.el.appendChild(node);
  }
}
