import * as sHomeAPI from '../../lib/api.js';
import caching from 'promise-memoize';

let cachedDeviceInfoListRequest = caching(sHomeAPI.getDeviceInfoList, { maxAge: 10 * 1000 });

class doorlookAccessory {

    constructor(platform, accessory, thngId, deviceId) {
        this.platform = platform
        this.accessory = accessory
        this.thngId = thngId
        this.deviceId = deviceId
        this.hap = platform.api.hap

        this.configureAccessory()
    }


    configureAccessory() {
        this.service = this.accessory.getService(this.hap.Service.LockMechanism) || this.accessory.addService(this.hap.Service.LockMechanism)
        if(this.service) {
            this.service.getCharacteristic(this.hap.Characteristic.LockCurrentState)
                .on('get', (callback) => {
                    callback(null, this.hap.Characteristic.LockCurrentState.SECURED);
                });

            this.service.getCharacteristic(this.hap.Characteristic.LockTargetState)
                .on('get', (callback) => {
                    callback(null, this.hap.Characteristic.LockCurrentState.SECURED);
                })
                .on('set', async (value, callback) => {
                    if(value == 0) {
                        var login = await sHomeAPI.login()
                        await sHomeAPI.unlockDoorlock(login.accessToken, this.thngId)
                    }
                    callback(null)
                });
        }

    }
}

export default doorlookAccessory;