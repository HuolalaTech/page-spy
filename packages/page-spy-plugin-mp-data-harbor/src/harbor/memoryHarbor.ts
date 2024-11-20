export class MemoryHarbor {
  container: any[] = [];

  public add(data: any) {
    this.container.push(data);
    return true;
  }

  clear() {
    this.container = [];
  }
}
