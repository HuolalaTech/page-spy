import deviceInfo from '@ohos.deviceInfo';

export const ROOM_SESSION_KEY = 'page-spy-room';

/**
 * The combined device info.
 * See the screenshot: /library/src/main/resources/base/media/mate60_device_info.png
 *
 * Format: HarmonyOS/<deviceInfo.osFullName> Device/<deviceInfo.marketName.replace(/\s/g, '_')>/<deviceInfo.sdkApiVersion>
 *    e.g. "HarmonyOS/3.0.0.19(Canary2) Device/HUAWEI_Mate_60_Pro/API_12"
 */
export const DEVICE_INFO = `HarmonyOS/${
  deviceInfo.osFullName
} Device/${deviceInfo.marketName.replace(/\s/g, '_')}/API_${
  deviceInfo.sdkApiVersion
}`;
