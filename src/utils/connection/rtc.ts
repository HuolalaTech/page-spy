import { SpyMessage, SpyRTC } from 'types';
import { PageSpyConfig } from 'src/config';
import { makeMessage } from '../message';
import * as DEBUG_MESSAGE_TYPE from '../message/debug-type';
import { SocketEvent } from './utils';

type MessageData = SpyMessage.MessageItem<'webrtc-connect', SpyRTC.RTCMessage>;

/**
 * Simple compatibility judgment.
 */
export const isSupportRTC =
  window.RTCPeerConnection &&
  window.RTCIceCandidate &&
  window.RTCSessionDescription;

export class RTCStore {
  private pc: RTCPeerConnection | null = null;

  private dc: RTCDataChannel | null = null;

  public get isBusy() {
    return this.dc?.readyState === 'open';
  }

  private static instance: RTCStore | null = null;

  constructor(
    config: RTCConfiguration,
    private socketRelay: ((data: MessageData) => void) | null = null,
  ) {
    if (!RTCStore.instance) {
      RTCStore.instance = this;
      this.pc = new RTCPeerConnection(config);
      this.init();
    }
    // eslint-disable-next-line no-constructor-return
    return RTCStore.instance;
  }

  public async init() {
    if (!this.pc || !this.socketRelay) return;

    this.pc.addEventListener('icecandidate', (e) => {
      if (e.candidate) {
        const msg: MessageData = makeMessage(
          DEBUG_MESSAGE_TYPE.WEBRTC_CONNECT,
          {
            type: DEBUG_MESSAGE_TYPE.ICE_CANDIDATE_FROM_SDK,
            data: e.candidate,
          },
        );

        // 发送给另一端
        // TODO: 为了 SDK 同时连接到多个 Debug，考虑缓存候选地址数据以便后面复用（支持复用吗？）
        this.socketRelay!(msg);
      }
    });
    const dc = this.pc.createDataChannel('PageSpy');
    dc.addEventListener('open', () => {
      dc.addEventListener('message', (e) => {
        // 收到消息数据
        console.log('🚀 ~ 收到消息:', e);
      });
    });
    dc.addEventListener('close', () => {
      // 清理工作
      // TODO: 尝试重连
      this.pc = null;
      this.dc = null;
      this.socketRelay = null;
    });
    this.dc = dc;

    const offer = await this.pc.createOffer();
    this.pc.setLocalDescription(offer);
    // 将 offer 会话描述发到另一端并设置为远程描述
    const msg: MessageData = makeMessage(DEBUG_MESSAGE_TYPE.WEBRTC_CONNECT, {
      type: DEBUG_MESSAGE_TYPE.SDP_FROM_SDK,
      data: offer,
    });
    this.socketRelay(msg);
  }

  public setRemoteDescription(sdp: RTCSessionDescription) {
    this.pc?.setRemoteDescription(sdp);
  }

  public addIceCandidate(ice: RTCIceCandidate) {
    this.pc?.addIceCandidate(ice);
  }

  public static handleWebRTCConnect(
    { source }: SocketEvent<SpyRTC.RTCMessage>,
    reply: (
      data: SpyMessage.MessageItem<'webrtc-connect', SpyRTC.RTCMessage>,
    ) => void,
  ) {
    let msg: Parameters<typeof reply>[0];

    if (!isSupportRTC) {
      msg = makeMessage(DEBUG_MESSAGE_TYPE.WEBRTC_CONNECT, {
        type: DEBUG_MESSAGE_TYPE.NOT_SUPPORT_WEBRTC,
        data: null,
      });
      reply(msg);
      return;
    }
    const { webrtc } = PageSpyConfig.get();
    if (!webrtc) {
      msg = makeMessage(DEBUG_MESSAGE_TYPE.WEBRTC_CONNECT, {
        type: DEBUG_MESSAGE_TYPE.CONFIG_NOT_VALID,
        data: null,
      });
      reply(msg);
      return;
    }
    const rtcStore = new RTCStore(webrtc, reply);
    const { type, data } = source.data;
    switch (type) {
      case DEBUG_MESSAGE_TYPE.ASK_FOR_STUN:
        break;
      case DEBUG_MESSAGE_TYPE.SDP_FROM_DEBUGGER:
        break;
      case DEBUG_MESSAGE_TYPE.ICE_CANDIDATE_FROM_DEBUGGER:
        break;
      default:
        break;
    }
  }
}
