import { PageSpyPlugin } from '@huolala-tech/page-spy-types';
import type { recordOptions } from 'rrweb/typings/types';
import type { eventWithTime } from '@rrweb/types';

interface Options extends recordOptions<eventWithTime> {
  // The data from 'rrweb-event' is typically larger (more interactions and complex
  // webpage structures result in larger data volumes). When developers debug,
  // real-time transmission can impose a burden on network overhead, and page interactions
  // are not always critical information. Considering these factors, this plugin only
  // dispatch the 'public-data' event for statistical plugins to collect. If you want
  // to view page interactions online during debugging, set it to true.
  allowOnline?: true;
}

declare class RRWebPlugin implements PageSpyPlugin {
  constructor(options?: Options);
}

export default RRWebPlugin;
