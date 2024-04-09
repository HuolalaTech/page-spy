export default class Logger {
  static log(input: string, tag: string = '[PageSpy]') {
    const MAX_LENGTH: number = 1023;

    let startIndex: number = 0;
    let endIndex: number = 0;
    const content = `${tag} ${input}`;
    if (content.length > MAX_LENGTH) {
      endIndex = MAX_LENGTH;
      startIndex = 0;
      const count = Math.ceil(content.length / MAX_LENGTH);
      for (let a = 0; a < count; a++) {
        console.log(content.substring(startIndex, endIndex));

        startIndex = endIndex;
        if (endIndex + MAX_LENGTH > content.length) {
          endIndex = content.length;
        } else {
          endIndex += MAX_LENGTH;
        }
      }
    } else {
      console.log(content);
    }
  }
}
