import { ROOM_SESSION_KEY } from 'base/src/constants';
import {
  SocketStoreBase,
  SocketState,
  SocketWrapper,
} from 'base/src/socket-base';
import { UPDATE_ROOM_INFO } from 'base/src/message/server-type';
import type { SpyMP } from '@huolala-tech/page-spy-types';
import { combineName } from 'base/src/device';
import { getMPSDK, utilAPI } from '../utils';
import Device from '../device';

export class MPSocketWrapper extends SocketWrapper {
  private socketInstance: MPSocket | null = null;

  private state: SocketState = 0;

  // some ali-family app only support single socket connection...
  public static isSingleSocket = false;

  async init(url: string) {
    this.state = SocketState.CONNECTING;
    const mp = getMPSDK();
    const closeHandler: SocketOnCloseHandler = (data) => {
      this.state = SocketState.CLOSED;
      this.emit('close', data);
    };
    const openHandler: SocketOnOpenHandler = (data) => {
      this.state = SocketState.OPEN;
      this.emit('open', data);
    };
    const errorHandler: SocketOnErrorHandler = (data) => {
      this.state = SocketState.CLOSED;
      this.emit('error', data);
    };
    const messageHandler: SocketOnMessageHandler = (data) => {
      this.emit('message', data);
    };

    if (!MPSocketWrapper.isSingleSocket) {
      let task = mp.connectSocket({
        url,
        multiple: true, // for alipay mp to return a task
        complete() {}, // make sure the uniapp return a task
      });
      if (task instanceof Promise) {
        task = await task;
      }
      task.onClose(closeHandler);
      task.onError(errorHandler);
      task.onOpen(openHandler);
      task.onMessage(messageHandler);
      this.socketInstance = task;
    } else {
      mp.connectSocket({ url });
      mp.onSocketClose(closeHandler);
      mp.onSocketError(errorHandler);
      mp.onSocketMessage(messageHandler);
      mp.onSocketOpen(openHandler);
    }
  }

  send(data: string) {
    if (MPSocketWrapper.isSingleSocket) {
      getMPSDK().sendSocketMessage({ data });
    } else {
      this.socketInstance?.send({
        data,
      });
    }
  }

  close() {
    if (MPSocketWrapper.isSingleSocket) {
      getMPSDK().closeSocket({});
    } else {
      this.socketInstance?.close({});
    }
    this.state = SocketState.CLOSED;
  }

  getState(): SocketState {
    return this.state;
  }
}

export class MPSocketStore extends SocketStoreBase {
  // websocket socketInstance
  protected socketWrapper = new MPSocketWrapper();

  public getPageSpyConfig: (() => Required<SpyMP.MPInitConfig>) | null = null;

  updateRoomInfo() {
    if (this.getPageSpyConfig) {
      const { project, title } = this.getPageSpyConfig();
      const device = combineName(Device.info);
      this.send(
        {
          type: UPDATE_ROOM_INFO,
          content: {
            info: {
              name: device,
              group: project,
              tags: {
                title,
              },
            },
          },
        },
        true,
      );
    }
  }

  public getSocket() {
    return this.socketWrapper;
  }

  // this is an abstract method of parent class, cannot be static
  /* eslint-disable-next-line */
  onOffline() {
    utilAPI.removeStorage(ROOM_SESSION_KEY);
  }
}

export default new MPSocketStore();
