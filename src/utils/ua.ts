export function getOS() {
  const sUserAgent = navigator.userAgent;
  const isWin =
    navigator.platform === 'Win32' || navigator.platform === 'Windows';
  const isMac =
    navigator.platform === 'Mac68K' ||
    navigator.platform === 'MacPPC' ||
    navigator.platform === 'Macintosh' ||
    navigator.platform === 'MacIntel';
  const bIsIpad = sUserAgent.match('iPad');
  const bIsIphoneOs = sUserAgent.match('iPhone');
  const isUnix = navigator.platform === 'X11' && !isWin && !isMac;
  const isLinux = String(navigator.platform).indexOf('Linux') > -1;
  const bIsAndroid = sUserAgent.match('Android');
  const bIsCE =
    sUserAgent.match('Windows CE') ||
    sUserAgent.match('WinCE') ||
    sUserAgent.match('WindowsCE');
  const bIsWM = sUserAgent.match('Windows Mobile');
  const bIsWP = sUserAgent.match('Windows Phone OS');
  if (bIsIpad || bIsIphoneOs) return 'IOS';
  if (isMac) return 'Mac';
  if (isUnix) return 'Unix';
  if (isLinux) {
    if (bIsAndroid) {
      return 'Android';
    }
    return 'Linux';
  }
  if (bIsCE) return 'Windows CE';
  if (bIsWM) return 'Windows Mobile';
  if (bIsWP) return 'Windows Phone';

  if (sUserAgent.match('BlackBerry')) return 'BlackBerry OS';
  if (sUserAgent.match('RIM Tablet OS')) return 'BlackBerry Tablet OS';
  if (sUserAgent.match('(?:web|hpw)OS')) return 'webOS';
  if (
    sUserAgent.match('SymbianOS/9.1') ||
    sUserAgent.match('Series[ ]?60') ||
    sUserAgent.match('S60')
  ) {
    return 'Series60';
  }

  if (isWin) {
    const isWin2K =
      sUserAgent.indexOf('Windows NT 5.0') > -1 ||
      sUserAgent.indexOf('Windows 2000') > -1;
    if (isWin2K) return 'Win2000';
    const isWinXP =
      sUserAgent.indexOf('Windows NT 5.1') > -1 ||
      sUserAgent.indexOf('Windows XP') > -1;
    if (isWinXP) return 'WinXP';
    const isWin2003 =
      sUserAgent.indexOf('Windows NT 5.2') > -1 ||
      sUserAgent.indexOf('Windows 2003') > -1;
    if (isWin2003) return 'Win2003';
    const isWinVista =
      sUserAgent.indexOf('Windows NT 6.0') > -1 ||
      sUserAgent.indexOf('Windows Vista') > -1;
    if (isWinVista) return 'WinVista';
    const isWin7 =
      sUserAgent.indexOf('Windows NT 6.1') > -1 ||
      sUserAgent.indexOf('Windows 7') > -1;
    if (isWin7) return 'Win7';
    const isWin8 =
      sUserAgent.indexOf('Windows NT 6.2') > -1 ||
      sUserAgent.indexOf('Windows 8') > -1;
    if (isWin8) return 'Win8';
  }

  return 'other';
}

export function getBrowser() {
  const ua = navigator.userAgent;
  let tem;
  let M =
    ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) ||
    [];
  if (ua.match('MicroMessenger')) return 'Weixin';

  if (/trident/i.test(M[1])) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return `IE ${tem[1] || ''}`;
  }
  if (M[1] === 'Chrome') {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
  }
  M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
  tem = ua.match(/version\/(\d+)/i);
  if (tem != null) M.splice(1, 1, tem[1]);
  return M.join(':');
}
