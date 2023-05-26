// File size is not recommended to exceed 6M,
// 10M files would result negative performance impact distinctly in local-test.
export const MAX_SIZE = 1024 * 1024 * 6;
export const Reason = {
  EXCEED_SIZE: 'Exceed maximum limit',
};

export function getURL(url: string) {
  if (url.startsWith('//')) {
    // eslint-disable-next-line no-param-reassign
    url = window.location.protocol + url;
  }

  if (/^https?:\/\//i.test(url)) {
    return new URL(url);
  }
  return new URL(url, window.location.href);
}

export function resolveUrlInfo(target: URL | string) {
  try {
    const { href, pathname, search, searchParams } = new URL(
      target,
      window.location.href,
    );
    const url = href;
    let name = pathname.replace(/[/]*$/, '').split('/').pop() || '';
    const query: Record<string, string> = {};
    if (search) {
      name += search;
      searchParams.forEach((value, key) => {
        query[key] = value;
      });
    }

    return {
      url,
      name,
      query,
    };
  } catch (e) {
    console.error(e);
    return {
      url: 'Unknown',
      name: 'Unknown',
      query: null,
    };
  }
}
