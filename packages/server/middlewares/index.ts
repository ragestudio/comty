import withAuthentication from "./withAuthentication/index.js"
import withOptionalAuthentication from "./withOptionalAuthentication/index.js"
import botAuthentication from "./botAuthentication/index.js"
import onlyAdmin from "./onlyAdmin/index.js"
import roles from "./roles/index.js"

export default {
	auth: withAuthentication,
	withAuth: withAuthentication,
	withAuthentication: withAuthentication,
	withOptionalAuthentication: withOptionalAuthentication,
	botAuthentication,
	onlyAdmin,
	roles,
}
