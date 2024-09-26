export const pageSpyExist = () => {
  return ['PageSpy', 'DataHarborPlugin', 'RRWebPlugin'].every((prop) =>
    Object.prototype.hasOwnProperty.call(window, prop),
  );
};

export const dot = (className: string) => {
  return `.${className}`;
};
