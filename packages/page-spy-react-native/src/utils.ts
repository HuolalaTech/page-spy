export const joinQuery = (args: Record<string, unknown>) => {
  const arr: string[] = [];
  Object.entries(args).forEach(([k, v]) => {
    arr.push(`${k}=${v}`);
  });
  return arr.join('&');
};

// Some platform has no global object, we provide this function to manually create your own global object.
let customGlobal: Record<string, any> = {};
export const setCustomGlobal = (global: Record<string, any>) => {
  customGlobal = global;
};

// get the global context.
export const getGlobal = () => {
  let foundGlobal: Record<string, any> = {};
  if (typeof globalThis === 'object' && Object.keys(global).length > 1) {
    foundGlobal = globalThis;
  } else if (typeof global === 'object' && Object.keys(global).length > 1) {
    foundGlobal = global;
  }
  if (customGlobal) {
    Object.assign(foundGlobal, customGlobal);
  }
  return foundGlobal;
};
