import getMethod from "./methods/get"
import getAllByGroupMethod from "./methods/getAllByGroup"
import createMethod from "./methods/create"
import deleteMethod from "./methods/delete"

export default class GroupInvites {
	static get model() {
		return global.scylla.model("group_invite_key")
	}

	static get = getMethod.bind(this)
	static getAllByGroup = getAllByGroupMethod.bind(this)

	static create = createMethod.bind(this)
	static delete = deleteMethod.bind(this)
}
