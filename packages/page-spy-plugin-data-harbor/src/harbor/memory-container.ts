import { Container } from './base';

export default class MemoryContainer implements Container {
  data: any[] = [];

  public init() {
    return true;
  }

  public add(d: any) {
    this.data.push(d);
    return this.data.length - 1;
  }

  public getAll() {
    return this.data;
  }

  public clear() {
    this.data = [];
  }

  public drop() {
    this.data = [];
  }
}
