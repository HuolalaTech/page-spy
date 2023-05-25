// File size is not recommended to exceed 6M,
// 10M files would result negative performance impact distinctly in local-test.
export const MAX_SIZE = 1024 * 1024 * 6;
export const Reason = {
  EXCEED_SIZE: 'Exceed maximum limit',
};

/* c8 ignore start */
export function getURL(url: string) {
  if (url.startsWith('//')) {
    // eslint-disable-next-line no-param-reassign
    url = window.location.protocol + url;
  }
  if (url.startsWith('http')) {
    return new URL(url);
  }
  return new URL(url, window.location.href);
}
/* c8 ignore stop */
