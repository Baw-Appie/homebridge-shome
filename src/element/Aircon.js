var sHomeAPI = require('../../lib/api.js')
var caching = require('promise-memoize')

let cachedDeviceInfoListRequest = caching(sHomeAPI.getDeviceInfoList, { maxAge: 10 * 1000 });

class airconAccessory {

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

        this.service = this.accessory.getService(this.hap.Service.HeaterCooler) || this.accessory.addService(this.hap.Service.HeaterCooler)
        if(this.service) {
            this.service.getCharacteristic(this.hap.Characteristic.Active)
                .on('get', async (callback) => {
                    var login = await sHomeAPI.login()
                    var deviceInfoListRequest = await cachedDeviceInfoListRequest(login.accessToken, 'aircon', this.thngId)
                    var done = false;
                    deviceInfoListRequest.deviceInfoList.forEach(item => {
                        if(item.deviceId == deviceId) {
                            callback(null, item.deviceStatus)
                            done = true
                        }
                    })
                    if(done == false) callback(null, 0);
                })
                .on('set', async (value, callback) => {
                    log.debug(`${accessory.displayName}(${deviceId}) 에어컨 작동 상태가 변경되었습니다: ${value == 0 ? "OFF" : "ON"}`)
                    this.platform.airconQueue.enqueue({
                        deviceId,
                        state: value == 0 ? "OFF" : "ON",
                        deviceName: accessory.displayName
                    })
                    if(!this.platform.airconQueue.isProcessing()) {
                        this.platform.airconQueue.setProccessing(true)
                        while(!this.platform.airconQueue.isEmpty()) {
                            var data = this.platform.airconQueue.dequeue()
                            var login = await sHomeAPI.login()
                            var response = await sHomeAPI.setDevice(login.accessToken, this.thngId, data.state, data.deviceId, "on-off", "aircon")
                            log.debug(response)
                            log.debug(`${data.deviceName}(${data.deviceId}) 에어컨 작동 상태 변경이 완료되었습니다: ${data.state}`)
                            await new Promise(resolve => setTimeout(resolve, 0.3 * 1000));
                        }
                        cachedDeviceInfoListRequest.clear()
                        this.platform.airconQueue.setProccessing(false)
                    }
                    callback(null)
                });

            this.service.getCharacteristic(this.hap.Characteristic.CurrentHeaterCoolerState)
                .on('get', (callback) => {
                    callback(null, this.hap.Characteristic.TargetHeaterCoolerState.HEAT);
                });

            this.service.getCharacteristic(this.hap.Characteristic.TargetHeaterCoolerState)
                .on('get', (callback) => {
                    callback(null, this.hap.Characteristic.TargetHeaterCoolerState.COOL);
                })
                .on('set', (value, callback) => {
                    callback(null);
                });

            this.service.getCharacteristic(this.hap.Characteristic.CurrentTemperature)
                .on('get', async (callback) => {
                    var login = await sHomeAPI.login()
                    var deviceInfoListRequest = await cachedDeviceInfoListRequest(login.accessToken, 'aircon', this.thngId)
                    var done = false;
                    deviceInfoListRequest.deviceInfoList.forEach(item => {
                        if(item.deviceId == deviceId) {
                            callback(null, item.currentTemp)
                            done = true
                        }
                    })
                    if(done == false) callback(null, 99);
                })

            this.service.getCharacteristic(this.hap.Characteristic.TemperatureDisplayUnits)
                .on('get', (callback) => {
                    callback(null, this.hap.Characteristic.TemperatureDisplayUnits.CELSIUS);
                })
                .on('set', (value, callback) => {
                    callback(null);
                });

            this.service.getCharacteristic(this.hap.Characteristic.CoolingThresholdTemperature)
                .setProps({
                    minValue: 16,
                    maxValue: 30,
                    minStep: 1
                })
                .on('get', async (callback) => {
                    var login = await sHomeAPI.login()
                    var deviceInfoListRequest = await cachedDeviceInfoListRequest(login.accessToken, 'aircon', this.thngId)
                    var done = false;
                    deviceInfoListRequest.deviceInfoList.forEach(item => {
                        if(item.deviceId == deviceId) {
                            callback(null, item.setTemp)
                            done = true
                        }
                    })
                    if(done == false) callback(null, 99);
                })
                .on('set', async (value, callback) => {
                    log.debug(`${accessory.displayName}(${deviceId}) 에어컨 희망 온도가 변경되었습니다: ${value}`)
                    var login = await sHomeAPI.login()
                    var response = await sHomeAPI.setDevice(login.accessToken, this.thngId, value, deviceId, "temperature", "aircon")
                    log.debug(response)
                    log.debug(`${accessory.displayName}(${deviceId}) 에어컨 희망 온도가 변경이 완료되었습니다: ${value}`)
                    callback(null);
                });

            this.service.getCharacteristic(this.hap.Characteristic.HeatingThresholdTemperature)
                .setProps({
                    minValue: 16,
                    maxValue: 30,
                    minStep: 1
                })
                .on('get', async (callback) => {
                    var login = await sHomeAPI.login()
                    var deviceInfoListRequest = await cachedDeviceInfoListRequest(login.accessToken, 'aircon', this.thngId)
                    var done = false;
                    deviceInfoListRequest.deviceInfoList.forEach(item => {
                        if(item.deviceId == deviceId) {
                            callback(null, item.setTemp)
                            done = true
                        }
                    })
                    if(done == false) callback(null, 99);
                })
                .on('set', async (value, callback) => {
                    log.debug(`${accessory.displayName}(${deviceId}) 에어컨 희망 온도가 변경되었습니다: ${value}`)
                    var login = await sHomeAPI.login()
                    var response = await sHomeAPI.setDevice(login.accessToken, this.thngId, value, deviceId, "temperature", "aircon")
                    log.debug(response)
                    log.debug(`${accessory.displayName}(${deviceId}) 에어컨 희망 온도가 변경이 완료되었습니다: ${value}`)
                    callback(null);
                });
        }
    }
}

module.exports = airconAccessory;