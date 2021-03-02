// var HomeBridge = require('homebridge')
var airconAccessory = require('./element/Aircon.js')
var lightAccessory = require('./element/Light.js')
var doorlockAccessory = require('./element/Doorlock.js')

var sHomeAPI = require('../lib/api.js')
var Queue = require('../lib/queue.js')
var caching = require('promise-memoize')

let cachedDeviceInfoListRequest = caching(sHomeAPI.getDeviceInfoList, { maxAge: 10*1000 });

const PLUGIN_NAME = "homebridge-shome";
const PLATFORM_NAME = "sHomePlugin";

module.exports = (api) => {
  hap = api.hap;
  Accessory = api.platformAccessory;

  api.registerPlatform(PLATFORM_NAME, sHomePlugin);
};

class sHomePlugin {

  constructor(log, config, api) {

    this.accessories = [];

    this.log = log;
    this.api = api;
    
    this.airconQueue = new Queue();
    this.lightQueue = new Queue();

    sHomeAPI.setUserInfo(config)

    log.info("초기화를 완료했습니다.");

    api.on("didFinishLaunching", async () => {

      log.info("sHome 플러그인이 실행되었습니다. 기기를 초기화하는 중...");
      var login = await sHomeAPI.login()
      var deviceListRequest = await sHomeAPI.getDeviceList(login.accessToken)
      deviceListRequest.deviceList.forEach(async item => {
        switch (item.thngModelTypeName) {
          case "AIRCON":
            this.log.info("sHome에 연결된 에어컨을 발견했습니다: %s", item.thngId);
            var deviceInfoListRequest = await cachedDeviceInfoListRequest(login.accessToken, 'aircon', item.thngId)
            for (let infoItem of deviceInfoListRequest.deviceInfoList) {
              let uuid = api.hap.uuid.generate(item.thngId+infoItem.deviceId)
              this.log.info("sHome에 연결된 에어컨을 추가합니다: %s", infoItem.nickname);
              let existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid)
              const accessory = existingAccessory ? existingAccessory : new this.api.platformAccessory(infoItem.nickname, uuid);
              new airconAccessory(this, accessory, item.thngId, infoItem.deviceId)
              if (existingAccessory) continue
              this.accessories.push(accessory)
              this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }
            break;

          case "LIGHT":
            this.log.info("sHome에 연결된 조명을 발견했습니다: %s", item.thngId);
            var deviceInfoListRequest = await cachedDeviceInfoListRequest(login.accessToken, 'light', item.thngId)
            for (let infoItem of deviceInfoListRequest.deviceInfoList) {
              let uuid = api.hap.uuid.generate(item.thngId + infoItem.deviceId)
              this.log.info("sHome에 연결된 조명을 추가합니다: %s", infoItem.nickname);
              let existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid)
              const accessory = existingAccessory ? existingAccessory : new this.api.platformAccessory(infoItem.nickname, uuid);
              new lightAccessory(this, accessory, item.thngId, infoItem.deviceId)
              if (existingAccessory) continue
              this.accessories.push(accessory)
              this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }
            break;


          case "DOORLOCK":
            this.log.info("sHome에 연결된 도어록을 발견했습니다: %s", item.thngId);
            let uuid = api.hap.uuid.generate(item.thngId + "1")
            this.log.info("sHome에 연결된 도어록을 추가합니다: %s", item.nickname);
            let existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid)
            const accessory = existingAccessory ? existingAccessory : new this.api.platformAccessory(item.nickname, uuid);
            new doorlockAccessory(this, accessory, item.thngId, "1")
            if (existingAccessory) break
            this.accessories.push(accessory)
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            break;
          
          default:
            this.log.info("homebridge-shome 미지원 기기가 발견되었습니다. 무시합니다: %s", item.thngModelTypeName);
            break;
        }
      })

    });
  }

  configureAccessory(accessory) {
    this.log("캐시에서 악세사리를 불러왔습니다: %s", accessory.displayName);
    this.accessories.push(accessory);
  }

}
