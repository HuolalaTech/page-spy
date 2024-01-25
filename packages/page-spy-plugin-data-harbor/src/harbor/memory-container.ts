import { Container } from './base';

export default class MemoryContainer implements Container {
  data: any[] = [];

  public async init() {
    return true;
  }

  public async add(d: any) {
    this.data.push(d);
    return this.data.length - 1;
  }

  public getAll() {
    return this.data;
  }

  public async count() {
    return this.data.length;
  }

  public clear() {
    this.data = [];
  }

  public drop() {
    this.data = [];
  }
}
