import { OnInitParams, PageSpyPlugin, SpyBase } from 'packages/page-spy-types';
import { Interpreter } from '@huolala-tech/eval5';
import { makeMessage } from 'base/src/message';
import { getRandomId } from 'base/src';
import atom from 'base/src/atom';
import { getGlobal } from 'mp-base/src/utils';
import { SocketStoreType } from 'packages/page-spy-types/lib/base';

export default class MPEvalPlugin implements PageSpyPlugin {
  public name: string = 'MPEvalPlugin';

  public static hasInitd = false;

  protected static interpreter: Interpreter | null = null;

  protected static socketStore: SocketStoreType | null = null;

  public onInit({ socketStore }: OnInitParams<any>) {
    if (MPEvalPlugin.hasInitd) return;
    MPEvalPlugin.hasInitd = true;
    MPEvalPlugin.socketStore = socketStore;
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
    MPEvalPlugin.hasInitd = false;
  }

  // run executable code which received from remote and send back the result
  private static handleDebugger(
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
          logs: [atom.transformToAtom(result)],
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
