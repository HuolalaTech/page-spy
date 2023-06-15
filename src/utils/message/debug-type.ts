/**
 * Just message
 */
export const CONNECT = 'connect';
export const CONSOLE = 'console';
export const SYSTEM = 'system';
export const NETWORK = 'network';
export const PAGE = 'page';
export const STORAGE = 'storage';
/**
 * Interactive: some type which sended by developer and need to reply something
 */
export const DEBUG = 'debug';
export const REFRESH = 'refresh';
export const ATOM_DETAIL = 'atom-detail';
export const ATOM_GETTER = 'atom-getter';
export const DEBUGGER_ONLINE = 'debugger-online';
export const WEBRTC_CONNECT = 'webrtc-connect';
/**
 * Sub message types specific to `webrtc-connect`
 */
export const ASK_FOR_STUN = 'ask-for-stun';
export const SDP_FROM_DEBUGGER = 'sdp-from-debugger';
export const ICE_CANDIDATE_FROM_DEBUGGER = 'ice-candidate-from-debugger';
export const NOT_SUPPORT_WEBRTC = 'not-support-webrtc';
export const CONFIG_NOT_VALID = 'config-not-valid';
export const ADDRESS_OF_STUN = 'address-of-stun';
export const SDP_FROM_SDK = 'sdp-from-sdk';
export const ICE_CANDIDATE_FROM_SDK = 'ice-candidate-from-sdk';
