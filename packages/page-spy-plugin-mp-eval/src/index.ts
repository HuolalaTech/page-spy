import { Interpreter } from '@huolala-tech/eval5';
import { makeMessage } from '@huolala-tech/page-spy-base/dist/message';
import { getRandomId, psLog } from '@huolala-tech/page-spy-base/dist/utils';
import { getGlobal } from '@huolala-tech/page-spy-mp-base';
import type {
  OnInitParams,
  PageSpyPlugin,
  SpyBase,
} from '@huolala-tech/page-spy-types';
import type { Atom, SocketStoreBase } from '@huolala-tech/page-spy-base';

export default class MPEvalPlugin implements PageSpyPlugin {
  public name: string = 'MPEvalPlugin';

  public static hasInitd = false;

  protected static interpreter: Interpreter | null = null;

  protected static socketStore: SocketStoreBase | null = null;

  protected static atom: Atom | null = null;

  public onInit({ socketStore, atom }: OnInitParams<any>) {
    if (MPEvalPlugin.hasInitd) return;

    const mpWarningText =
      '!!!WARNING!!!: When submitting the mini program for review, be sure to delete the [@huolala-tech/page-spy-plugin-mp-eval] in the code, otherwise the review will fail.';

    psLog.log(mpWarningText);
    psLog.info(mpWarningText);
    psLog.warn(mpWarningText);

    MPEvalPlugin.hasInitd = true;
    MPEvalPlugin.socketStore = socketStore;
    MPEvalPlugin.atom = atom;
    if (!MPEvalPlugin.interpreter) {
      MPEvalPlugin.interpreter = new Interpreter(getGlobal());
    }
    socketStore.addListener('debug', MPEvalPlugin.handleDebugger);
  }

  public onReset() {
    MPEvalPlugin.socketStore?.removeListener(
      'debug',
      MPEvalPlugin.handleDebugger,
    );
    MPEvalPlugin.interpreter = null;
    MPEvalPlugin.atom = null;
    MPEvalPlugin.socketStore = null;
    MPEvalPlugin.hasInitd = false;
  }

  // run executable code which received from remote and send back the result
  public static handleDebugger(
    {
      source,
    }: SpyBase.InteractiveEvent<{
      code: string;
      nodes: any;
    }>,
    reply: (data: any) => void,
  ) {
    const { type, data } = source;
    if (type === 'debug') {
      const { code, nodes } = data;
      const originMsg = makeMessage('console', {
        logType: 'debug-origin',
        logs: [
          {
            id: getRandomId(),
            type: 'debug-origin',
            value: code,
          },
        ],
      });
      reply(originMsg);
      try {
        // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
        const result = MPEvalPlugin.interpreter?.evaluateNode(nodes);
        // const result = new Function(`return ${data}`)();
        const evalMsg = makeMessage('console', {
          logType: 'debug-eval',
          logs: [MPEvalPlugin.atom?.transformToAtom(result)],
        });
        reply(evalMsg);
      } catch (err) {
        const errMsg = makeMessage('console', {
          logType: 'error',
          logs: [
            {
              type: 'error',
              value: (err as Error).stack,
            },
          ],
        });
        reply(errMsg);
      }
    }
  }
}
