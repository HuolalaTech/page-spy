import type { SpyMessage, SpySocket } from 'types';
import SocketStoreBase, {
  SocketState,
  SocketWrapper,
} from 'src/utils/socket-base';

class MPWeixinSocketWrapper extends SocketWrapper {
  private socket: MPWeixinSocket | null = null;
  constructor() {
    super();
  }
  private state: SocketState = 0;
  init(url: string) {
    this.state = SocketState.CONNECTING;
    this.socket = wx.connectSocket({
      url,
    });
    this.socket.onClose((data) => {
      this.state = SocketState.CLOSED;
      this.emit('close', data);
    });
    this.socket.onError((data) => {
      this.state = SocketState.CLOSED;
      this.emit('error', data);
    });
    this.socket.onOpen((data) => {
      this.state = SocketState.OPEN;
      this.emit('open', data);
    });
    this.socket.onMessage((data) => {
      this.emit('message', data);
    });
  }

  send(data: Object) {
    this.socket?.send({
      data,
    });
  }
  close(data?: {}) {
    this.socket?.close({});
    this.socket = null;
  }
  destroy(): void {
    this.socket = null;
  }
  getState(): SocketState {
    return this.state;
  }
}

interface SocketEvent<T = any> {
  source: {
    type: SpyMessage.MessageType;
    data: T;
  };
  from: SpySocket.Connection;
  to: SpySocket.Connection;
}
type SocketEventCallback = (
  data: SocketEvent,
  reply: (data: any) => void,
) => void;

interface GetterMember {
  key: string; // 属性名
  id: string; // 当前键的 id
  parentId: string; // 当前属性所在容器的 id
  instanceId: string; // 当前实例的 id
}

export class MPWeixinSocketStore extends SocketStoreBase {
  // websocket instance
  protected socket = new MPWeixinSocketWrapper();

  public getSocket() {
    return this.socket;
  }

  onOffline(): void {}

  constructor() {
    super();
  }
}

export default new MPWeixinSocketStore();
