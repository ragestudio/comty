export default {
	auth: require("./withAuthentication").default,
	withAuth: require("./withAuthentication").default,
	withAuthentication: require("./withAuthentication").default,
	withOptionalAuthentication: require("./withOptionalAuthentication").default,

	botAuthentication: require("./botAuthentication").default,

	onlyAdmin: require("./onlyAdmin").default,
	roles: require("./roles").default,
}
