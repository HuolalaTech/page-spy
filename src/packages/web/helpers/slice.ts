const SIGNAL_BYTE = 2; //
const MAX_BYTE = 1024 * 100;
const MAX_SIZE = MAX_BYTE / SIGNAL_BYTE;

export function byteSize(val: string) {
  const byte =
    encodeURI(val).split(/%(?:u[0-9A-F]{2})?[0-9A-F]{2}|./).length - 1;
  if (byte < 1024) {
    return `${byte} B`;
  }
  if (byte < 1024 * 1024) {
    return `${(byte / 1024).toFixed(2)} kB`;
  }

  return `${(byte / (1024 * 1024)).toFixed(2)} mB`;
}

export function slice(val: string): string[] {
  let result = [];
  if (val.length > MAX_SIZE) {
    result.push(val.slice(0, MAX_SIZE));
    const data = val.slice(MAX_SIZE);
    result = result.concat(slice(data));
    return result;
  }
  return [val];
}
