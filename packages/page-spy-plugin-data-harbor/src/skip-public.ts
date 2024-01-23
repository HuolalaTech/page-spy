/**
 * Why do we need to skip "public-data" events? This is because it may lead to a cyclic event loop.
 * For instance, the "page-spy-plugin-data-harbor" listens for "public-data" events and stores data
 * in indexedDB. Meanwhile, the "DatabasePlugin" built into PageSpy listens for operations on
 * indexedDB and sends "public-data" events. This can result in an infinite time loop. Therefore,
 * we define specific identifiers to assist PageSpy in sending "public-data" events at the right
 * moments.
 */
export const SKIP_PUBLIC_IDB_PREFIX = '__PUBLIC__';
