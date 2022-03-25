var axios = require('axios')
var moment = require('moment');
var crypto = require('crypto')
const jwt_decode = require('jwt-decode');

function sha512(string) {
	return crypto.createHash('sha512').update(string).digest('hex');
}

var cachedAccessToken = null
var username = ""
var password = ""
var deviceId = ""
var hspid = ""

exports.setUserInfo = (info) => {
	username = info.username,
	password = info.password,
	deviceId = info.deviceId
}

exports.login = async () => {
	try {
		if(cachedAccessToken != null) {
			let data = jwt_decode(cachedAccessToken)
			if (!(Date.now() >= data.exp * 1000)) return { success: true, accessToken: cachedAccessToken }
		}

		var loginPayload = {
			appRegstId: "6110736314d9eef6baf393f3e43a5342f9ccde6ef300d878385acd9264cf14d5",
			chinaAppRegstId: "SHOME==6110736314d9eef6baf393f3e43a5342f9ccde6ef300d878385acd9264cf14d5",
			createDate: moment().utc().format("YYYYMMDDHHmmss"),
			hashData: "hashData",
			language: "KOR",
			mobileDeviceIdno: deviceId,
			password: password,
			userId: username
		}
		loginPayload.password = sha512(loginPayload.password)
		loginPayload.hashData = sha512(`IHRESTAPI${loginPayload.userId}${loginPayload.password}${loginPayload.mobileDeviceIdno}${loginPayload.appRegstId}${loginPayload.chinaAppRegstId}${loginPayload.language}${loginPayload.createDate}`)
		var loginResponse = await axios.put("https://shome-api.samsung-ihp.com/v18/users/login", null, { params: loginPayload })
		hspid = loginResponse.data.ihdId
		return { success: true, accessToken: loginResponse.data.accessToken }
	} catch(e) {
		return { success: false, message: e.message }
	}
}

exports.getDeviceList = async (accessToken) => {
	try {
		var deviceRequestPayload = {
			method: "get",
			url: `https://shome-api.samsung-ihp.com/v16/settings/${hspid}/devices/`,
			params: {
				createDate: moment().utc().format("YYYYMMDDHHmmss"),
				hashData: "hashData"
			},
			headers: {
				'Authorization': `Bearer ${accessToken}`, 
			}
		}
		deviceRequestPayload.params.hashData = sha512(`IHRESTAPI${hspid}${deviceRequestPayload.params.createDate}`)
		var deviceRequestResponse = await axios(deviceRequestPayload)
		return { success: true, deviceList: deviceRequestResponse.data.deviceList }
	} catch(e) {
		return { success: false, message: e.message }
	}
}

exports.getDeviceInfoList = async (accessToken, type, thngId) => {
	try {
		var requestPayload = {
			method: "get",
			url: `https://shome-api.samsung-ihp.com/v18/settings/${type}/${thngId}`,
			params: {
				createDate: moment().utc().format("YYYYMMDDHHmmss"),
				hashData: "hashData"
			},
			headers: {
				'Authorization': `Bearer ${accessToken}`, 
			}
		}
		requestPayload.params.hashData = sha512(`IHRESTAPI${thngId}${requestPayload.params.createDate}`)
		// console.log(requestPayload)
		var requestResponse = await axios(requestPayload)
		return { success: true, deviceInfoList: requestResponse.data.deviceInfoList }
	} catch(e) {
		return { success: false, message: e.message }
	}
}

exports.setDevice = async (accessToken, thngId, active, deviceId, type, thngType) => {
	try {
		var requestPayload = {
			method: "put",
			url: `https://shome-api.samsung-ihp.com/v18/settings/${thngType}/${thngId}/${deviceId}/${type}`,
			params: {
				createDate: moment().utc().format("YYYYMMDDHHmmss"),
				state: active,
				hashData: "hashData"
			},
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			}
		}
		requestPayload.params.hashData = sha512(`IHRESTAPI${thngId}${deviceId}${active}${requestPayload.params.createDate}`)
		var requestResponse = await axios(requestPayload)
		return { success: true }
	} catch (e) {
		return { success: false, message: e.message }
	}
}
exports.unlockDoorlock = async (accessToken, thngId) => {
	try {
		var requestPayload = {
			method: "put",
			url: `https://shome-api.samsung-ihp.com/v16/settings/doorlocks/${thngId}/open-mode`,
			params: {
				createDate: moment().utc().format("YYYYMMDDHHmmss"),
				pin: "",
				hashData: "hashData"
			},
			headers: {
				'Authorization': `Bearer ${accessToken}`,
			}
		}
		requestPayload.params.hashData = sha512(`IHRESTAPI${thngId}${requestPayload.params.createDate}`)
		var requestResponse = await axios(requestPayload)
		return { success: true }
	} catch (e) {
		return { success: false, message: e.message }
	}
}