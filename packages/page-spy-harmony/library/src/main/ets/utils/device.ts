import { DeviceInfo } from '../types/lib/device';

export const combineName = ({
  osType,
  osVersion,
  browserType,
  browserVersion,
}: DeviceInfo) => `${osType}/${osVersion} ${browserType}/${browserVersion}`;
