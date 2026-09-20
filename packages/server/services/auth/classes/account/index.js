import createMethod from "./methods/create.js"
import loginStrategyMethod from "./methods/loginStrategy.js"
import changePasswordMethod from "./methods/changePassword.js"
import usernameMeetPolicyMethod from "./methods/usernameMeetPolicy.js"
import passwordMeetPolicyMethod from "./methods/passwordMeetPolicy.js"
import sendActivationCodeMethod from "./methods/sendActivationCode.js"
import activateAccountMethod from "./methods/activateAccount.js"
import disableAccountMethod from "./methods/disableAccount.js"

export default class Account {
	static create = createMethod
	static loginStrategy = loginStrategyMethod
	static changePassword = changePasswordMethod
	static usernameMeetPolicy = usernameMeetPolicyMethod
	static passwordMeetPolicy = passwordMeetPolicyMethod
	static sendActivationCode = sendActivationCodeMethod
	static activateAccount = activateAccountMethod
	static disableAccount = disableAccountMethod
}
