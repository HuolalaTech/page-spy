// There are many where use event emitter, but the platform may not
// natively support it, so we made our own.
export class EventEmitter<E extends string, C extends Function> {
  private events: Map<E, C[]> = new Map();

  on(eventName: E, callback: C) {
    let list = this.events.get(eventName);
    if (!list) {
      list = [];
      this.events.set(eventName, list);
    }
    if (list.indexOf(callback) < 0) {
      list.push(callback);
    }
  }

  off(eventName: E, callback: C) {
    if (this.events.has(eventName)) {
      const list = this.events.get(eventName);
      const i = list!.indexOf(callback);
      if (i >= 0) {
        list?.splice(i, 1);
      }
    }
  }

  emit(eventName: E, ...args: any[]) {
    const list = this.events.get(eventName);
    if (list) {
      list.forEach((cb) => {
        cb(...args);
      });
    }
  }

  clearListeners(eventName: E) {
    this.events.delete(eventName);
  }

  clearAllListeners() {
    this.events.clear();
  }
}
