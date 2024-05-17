import { handle404, handle500, seeErrorResponse, seeRequestInfo } from '../api';
import deviceInfo from '@ohos.deviceInfo';
import LocalStorageDemo from '../components/LocalStorageDemo';
import TrackDemo from '../components/TrackDemo';
import PersistStorageDemo from '../components/PersistStorageDemo';


@Entry
@Component
struct Index {

  build() {
    Row() {
      Column() {
        Flex({ justifyContent: FlexAlign.Center, alignItems: ItemAlign.Start, direction: FlexDirection.Column }) {
          Button('Console')
            .margin({ bottom: 20 })
            .onClick(() => {
              console.log('设备信息', JSON.stringify({
                "设备类型": deviceInfo.deviceType,
                "设备厂家名称": deviceInfo.manufacture,
                "设备品牌名称": deviceInfo.brand,
                "外部产品系列": deviceInfo.marketName,
                "产品系列": deviceInfo.productSeries,
                "认证型号": deviceInfo.productModel,
                "内部软件子型号": deviceInfo.softwareModel,
                "硬件版本号": deviceInfo.hardwareModel,
                "设备序列号": deviceInfo.serial,
                "Bootloader版本号": deviceInfo.bootloaderVersion,
                "应用二进制接口（Abi）列表": deviceInfo.abiList,
                "安全补丁级别": deviceInfo.securityPatchTag,
                "产品版本": deviceInfo.displayVersion,
                "差异版本号": deviceInfo.incrementalVersion,
                "系统的发布类型": deviceInfo.osReleaseType,
                "系统版本": deviceInfo.osFullName,
                "Major版本号，随主版本更新增加": deviceInfo.majorVersion,
                "Senior版本号，随局部架构、重大特性增加": deviceInfo.seniorVersion,
                "Feature版本号，标识规划的新特性版本": deviceInfo.featureVersion,
                "Build版本号，标识编译构建的版本号": deviceInfo.buildVersion,
                "系统软件API版本": deviceInfo.sdkApiVersion,
                "首个版本系统软件API版本": deviceInfo.firstApiVersion,
                "版本ID": deviceInfo.versionId,
                "构建类型": deviceInfo.buildType,
                "构建用户": deviceInfo.buildUser,
                "构建主机": deviceInfo.buildHost,
                "构建时间": deviceInfo.buildTime,
                "构建版本Hash": deviceInfo.buildRootHash,
                "设备Udid,仅限系统应用使用": deviceInfo.udid,
                "发行版系统名称": deviceInfo.distributionOSName,
                "发行版系统版本号": deviceInfo.distributionOSVersion,
                "发行版系统api版本": deviceInfo.distributionOSApiVersion,
                "发行版系统类型": deviceInfo.distributionOSReleaseType,
              }))
            })

          Button("Error")
            .onClick(() => {
              console.log('触发 Error')
            })

          Button("Network (axios)")
            .onClick(() => {
              seeRequestInfo();
              handle404();
              handle500();
              seeErrorResponse();
            })

          Button("Storage")
            .onClick(() => {
              console.log("触发 Storage")
            })

          // LocalStorageDemo()
          // TrackDemo()
          // PersistStorageDemo()
        }
      }
      .width('100%')
    }
    .height('100%')
  }
}