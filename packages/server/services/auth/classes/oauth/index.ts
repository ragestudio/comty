import createAuthorizationCode from "./methods/createAuthorizationCode"
import exchangeCode from "./methods/exchangeCode"
import refreshAccessToken from "./methods/refreshAccessToken"
import getUserInfo from "./methods/getUserInfo"
import validateClient from "./methods/validateClient"
import registerApp from "./methods/registerApp"
import getUserApps from "./methods/getUserApps"
import updateApp from "./methods/updateApp"
import deleteApp from "./methods/deleteApp"
import regenerateSecret from "./methods/regenerateSecret"
import revokeToken from "./methods/revokeToken"
import ensureTTLIndex from "./methods/ensureTTLIndex"

import { validateScopes, buildClaims } from "./utils"

export default class OAuthProvider {
	static validateScopes = validateScopes
	static buildClaims = buildClaims

	createAuthorizationCode = createAuthorizationCode.bind(this)
	exchangeCode = exchangeCode.bind(this)
	refreshAccessToken = refreshAccessToken.bind(this)
	getUserInfo = getUserInfo.bind(this)
	validateClient = validateClient.bind(this)
	registerApp = registerApp.bind(this)
	getUserApps = getUserApps.bind(this)
	updateApp = updateApp.bind(this)
	deleteApp = deleteApp.bind(this)
	regenerateSecret = regenerateSecret.bind(this)
	revokeToken = revokeToken.bind(this)
	ensureTTLIndex = ensureTTLIndex.bind(this)
}
