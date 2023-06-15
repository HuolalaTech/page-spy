/**
 * Message type sended by Debugger
 */
export interface AskForStun {
  type: 'ask-for-stun';
  data: null;
}
export interface SdpFromDebugger {
  type: 'sdp-from-debugger';
  data: RTCSessionDescriptionInit;
}
export interface IceCandidateFromDebugger {
  type: 'ice-candidate-from-debugger';
  data: RTCIceCandidateInit;
}
/**
 * Response message type sended by SDK
 */
export interface NotSupportWebRTC {
  type: 'not-support-webrtc';
  data: null;
}
export interface ConfigNotValid {
  type: 'config-not-valid';
  data: null;
}
export interface AddressOfStun {
  type: 'address-of-stun';
  data: RTCIceServer[];
}
export interface SdpFromSdk {
  type: 'sdp-from-sdk';
  data: RTCSessionDescriptionInit;
}
export interface IceCandidateFromSdk {
  type: 'ice-candidate-from-sdk';
  data: RTCIceCandidateInit;
}

export type RTCMessage =
  | AskForStun
  | SdpFromDebugger
  | IceCandidateFromDebugger
  | NotSupportWebRTC
  | ConfigNotValid
  | AddressOfStun
  | SdpFromSdk
  | IceCandidateFromSdk;
