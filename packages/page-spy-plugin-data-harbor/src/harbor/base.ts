import { SKIP_PUBLIC_IDB_PREFIX } from '../skip-public';

export abstract class Container {
  /**
   * Returned `boolean` value indicated whether supported or not.
   */
  public abstract init(): Promise<boolean>;
  public abstract add(data: any): Promise<number>;
  public abstract getAll(): any;
  public abstract count(): Promise<number>;
  public abstract clear(): void;
  public abstract drop(): void;
}

export const PRIVATE_DB_NAME = `${SKIP_PUBLIC_IDB_PREFIX}page-spy`;
export const STORE_NAME = 'data-harbor';
export const INDEXEDDB_SUPPORTED =
  IDBFactory && IDBObjectStore && window.indexedDB;
