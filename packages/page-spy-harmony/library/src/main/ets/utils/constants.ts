import deviceInfo from '@ohos.deviceInfo';

export const ROOM_SESSION_KEY = 'page-spy-room';

/**
 * The combined device info.
 * See the screenshot: /library/src/main/resources/base/media/mate60_device_info.png
 *
 * Format: (<deviceInfo.deviceType>; OpenHarmony <deviceInfo.osFullName>) Device/<deviceInfo.marketName.replace(/\s/g, '_')> Api/<deviceInfo.sdkApiVersion>
 *    e.g. "(Phone; OpenHarmony 3.0.0.19) Device/HUAWEI_Mate_60_Pro API/12"
 */

const { deviceType, osFullName, marketName, sdkApiVersion } = deviceInfo;
const formatDeviceType = deviceType[0].toUpperCase() + deviceType.slice(1);
const formatMarketName = marketName.replace(/\s/g, '_');

export const DEVICE_INFO = `(${formatDeviceType}; OpenHarmony ${osFullName}) Device/${formatMarketName} API/${sdkApiVersion}`;
