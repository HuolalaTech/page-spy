import deviceInfo from '@ohos.deviceInfo';

export const ROOM_SESSION_KEY = 'page-spy-room';

/**
 * The combined device info.
 * See the screenshot: /library/src/main/resources/base/media/mate60_device_info.png
 *
 * e.g. "HarmonyOS/3.0.0.19(Canary2) SDK/12 Brand/HUAWEI_Mate_60_Pro"
 */
export const DEVICE_INFO = `HarmonyOS/${deviceInfo.osFullName.replace(
  /\s/g,
  '_',
)} SDK/${deviceInfo.sdkApiVersion} Brand/${deviceInfo.marketName.replace(
  /\s/g,
  '_',
)}`;
