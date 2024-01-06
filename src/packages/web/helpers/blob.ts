export const blob2base64Async = (blob: Blob) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = (e) => {
      resolve(e.target?.result);
    };
    /* c8 ignore next 3 */
    fr.onerror = () => {
      reject(new Error('blob2base64Async: can not convert'));
    };
    fr.readAsDataURL(blob);
  });
