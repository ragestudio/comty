import getMethod from "./get"
import createMethod from "./create"
import deleteMethod from "./delete"

import getAllByUserIdMethod from "./getAllByUserId"
import deleteAllByUserIdMethod from "./deleteAllByUserId"

import handleRefreshMethod from "./handleRefresh"

export default class Session {
	static get Model() {
		return global.scylla.model("auth_session")
	}

	static get = getMethod.bind(this)
	static create = createMethod.bind(this)
	static delete = deleteMethod.bind(this)

	static getAllByUserId = getAllByUserIdMethod.bind(this)
	static deleteAllByUserId = deleteAllByUserIdMethod.bind(this)

	static handleRefresh = handleRefreshMethod.bind(this)
}
