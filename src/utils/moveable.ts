export type UElement = HTMLElement & {
  isMoveEvent: boolean;
};

function getPosition(evt: TouchEvent | MouseEvent): Touch | MouseEvent {
  if (window.TouchEvent && evt instanceof TouchEvent) {
    return evt.touches[0];
  }
  return evt as MouseEvent;
}

/* eslint-disable no-param-reassign */
export function moveable(el: HTMLElement) {
  let rect = el.getBoundingClientRect();
  const critical = {
    xAxis: 0,
    yAxis: 0,
  };
  const touch = { x: 0, y: 0 };
  function move(evt: TouchEvent | MouseEvent) {
    evt.preventDefault();
    (el as UElement).isMoveEvent = true;
    const { clientX, clientY } = getPosition(evt);
    const diffX = clientX - touch.x;
    const diffY = clientY - touch.y;
    let resultX = rect.x + diffX;
    if (resultX < 0) {
      resultX = 0;
    } else if (resultX > critical.xAxis) {
      resultX = critical.xAxis;
    }
    let resultY = rect.y + diffY;
    if (resultY < 0) {
      resultY = 0;
    } else if (resultY > critical.yAxis) {
      resultY = critical.yAxis;
    }
    el.style.left = `${resultX}px`;
    el.style.top = `${resultY}px`;
  }
  function start(evt: TouchEvent | MouseEvent) {
    evt.preventDefault();
    (el as UElement).isMoveEvent = false;
    rect = el.getBoundingClientRect();
    critical.xAxis = document.documentElement.offsetWidth - rect.width;
    critical.yAxis = document.documentElement.offsetHeight - rect.height;

    const { clientX, clientY } = getPosition(evt);
    touch.x = clientX;
    touch.y = clientY;
    document.addEventListener('mousemove', move, false);
  }
  function end() {
    touch.x = 0;
    touch.y = 0;
    document.removeEventListener('mousemove', move);
  }
  el.addEventListener('mousedown', start, false);
  el.addEventListener('mouseup', end, false);

  el.addEventListener('touchstart', start, false);
  el.addEventListener('touchmove', move, false);
  el.addEventListener('touchend', end, false);
}
