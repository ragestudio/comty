export default class Account {
	static create = require("./methods/create").default
	static loginStrategy = require("./methods/loginStrategy").default
	static changePassword = require("./methods/changePassword").default
	static usernameMeetPolicy = require("./methods/usernameMeetPolicy").default
	static passwordMeetPolicy = require("./methods/passwordMeetPolicy").default
	static sendActivationCode = require("./methods/sendActivationCode").default
	static activateAccount = require("./methods/activateAccount").default
	static disableAccount = require("./methods/disableAccount").default
}
