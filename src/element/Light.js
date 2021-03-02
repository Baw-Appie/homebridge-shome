var sHomeAPI = require('../../lib/api.js')
var caching = require('promise-memoize')

let cachedDeviceInfoListRequest = caching(sHomeAPI.getDeviceInfoList, { maxAge: 10 * 1000 });

class lightAccessory {

    constructor(platform, accessory, thngId, deviceId) {
        this.platform = platform
        this.accessory = accessory
        this.thngId = thngId
        this.deviceId = deviceId
        this.hap = platform.api.hap

        this.configureAccessory()
    }


    configureAccessory() {
        var deviceId = this.deviceId
        var log = this.platform.log
        var accessory = this.accessory
        this.service = this.accessory.getService(this.hap.Service.Lightbulb) || this.accessory.addService(this.hap.Service.Lightbulb)

        if (this.service) {
            this.service.getCharacteristic(this.hap.Characteristic.On)
                .on("get", async (callback) => {
                    var login = await sHomeAPI.login()
                    var deviceInfoListRequest = await cachedDeviceInfoListRequest(login.accessToken, 'light', this.thngId)
                    var done = false;
                    deviceInfoListRequest.deviceInfoList.forEach(item => {
                        if (item.deviceId == deviceId) {
                            callback(null, item.deviceStatus)
                            done = true
                        }
                    })
                    if (done == false) callback(null, 0);
                })
                .on("set", async (value, callback) => {
                    log.debug(`${accessory.displayName}(${deviceId}) 조명 작동 상태가 변경되었습니다: ${value == 0 ? "OFF" : "ON"}`)
                    this.platform.lightQueue.enqueue({
                        deviceId,
                        state: value == 0 ? "OFF" : "ON",
                        deviceName: accessory.displayName
                    })
                    if (!this.platform.lightQueue.isProcessing()) {
                        this.platform.lightQueue.setProccessing(true)
                        while (!this.platform.lightQueue.isEmpty()) {
                            var data = this.platform.lightQueue.dequeue()
                            var login = await sHomeAPI.login()
                            var response = await sHomeAPI.setDevice(login.accessToken, this.thngId, data.state, data.deviceId, "on-off", "light")
                            log.debug(response)
                            log.debug(`${data.deviceName}(${data.deviceId}) 조명 작동 상태 변경이 완료되었습니다: ${data.state}`)
                            await new Promise(resolve => setTimeout(resolve, 0.1 * 1000));
                        }
                        cachedDeviceInfoListRequest.clear()
                        this.platform.lightQueue.setProccessing(false)
                    }
                    callback(null)
                });
        }
    }
}

module.exports = lightAccessory;