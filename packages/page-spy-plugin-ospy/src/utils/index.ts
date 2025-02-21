export const pageSpyExist = () => {
  return ['PageSpy', 'DataHarborPlugin', 'RRWebPlugin'].every((prop) => {
    return Object.prototype.hasOwnProperty.call(window, prop);
  });
};

export const dot = (className: string) => {
  return `.${className}`;
};

export const fillTimeText = (v: number) => {
  if (v >= 10) return v.toString();
  return `0${v}`;
};

export function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - 3600 * h) / 60);
  const s = Math.floor(seconds - 3600 * h - 60 * m);

  const hh = fillTimeText(h);
  const mm = fillTimeText(m);
  const ss = fillTimeText(s);
  if (h === 0) return `${mm}:${ss}`;

  return `${hh}:${mm}:${ss}`;
}
