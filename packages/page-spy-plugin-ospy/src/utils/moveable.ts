export type UElement = HTMLElement & {
  isMoveEvent: boolean;
};

const listenerOptions = {
  capture: false,
  passive: true,
};

function getPosition(evt: TouchEvent | MouseEvent): Touch | MouseEvent {
  if (window.TouchEvent && evt instanceof TouchEvent) {
    return evt.touches[0];
  }
  return evt as MouseEvent;
}

const POSITION_CACHE_ID = 'page-spy-position';

export function moveable(el: UElement) {
  const position = localStorage.getItem(POSITION_CACHE_ID);
  if (position) {
    const [x, y] = position.split(',');
    if (+x < window.innerWidth && +y < window.innerHeight) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  }

  let rect: DOMRect;
  const critical = {
    xAxis: 0,
    yAxis: 0,
  };
  const touch = { x: 0, y: 0 };
  function move(evt: TouchEvent | MouseEvent) {
    const { clientX, clientY } = getPosition(evt);
    const diffX = clientX - touch.x;
    const diffY = clientY - touch.y;
    if ([diffX, diffY].some((i) => Math.abs(i) > 5) && !el.isMoveEvent) {
      el.isMoveEvent = true;
      const preventClick = (e: MouseEvent) => {
        e.stopImmediatePropagation();
        el.removeEventListener('click', preventClick, true);
      };
      el.addEventListener('click', preventClick, true);
    }
    let resultX = rect.x + diffX;
    if (resultX <= 0) {
      resultX = 0;
    } else if (resultX >= critical.xAxis) {
      resultX = critical.xAxis;
    }
    let resultY = rect.y + diffY;
    if (resultY <= 0) {
      resultY = 0;
    } else if (resultY > critical.yAxis) {
      resultY = critical.yAxis;
    }

    el.style.left = `${resultX}px`;
    el.style.top = `${resultY}px`;
  }
  function end() {
    touch.x = 0;
    touch.y = 0;
    const { left, top } = el.getBoundingClientRect();
    localStorage.setItem(POSITION_CACHE_ID, `${left},${top}`);

    el.isMoveEvent = false;
    document.body.classList.remove('dragging');
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', end);

    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', end);
  }
  function start(evt: TouchEvent | MouseEvent) {
    el.isMoveEvent = false;
    rect = el.getBoundingClientRect();
    critical.xAxis = window.innerWidth - rect.width;
    critical.yAxis = window.innerHeight - rect.height;

    const { clientX, clientY } = getPosition(evt);
    touch.x = clientX;
    touch.y = clientY;
    document.body.classList.add('dragging');
    document.addEventListener('mousemove', move, listenerOptions);
    document.addEventListener('mouseup', end, listenerOptions);

    document.addEventListener('touchmove', move, listenerOptions);
    document.addEventListener('touchend', end, listenerOptions);
  }

  el.addEventListener('mousedown', start, listenerOptions);
  el.addEventListener('touchstart', start, listenerOptions);
}
