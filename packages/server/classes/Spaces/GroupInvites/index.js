import getMethod from "./methods/get"
import getAllByGroupMethod from "./methods/getAllByGroup"
import createMethod from "./methods/create"
import deleteMethod from "./methods/delete"

import GroupInviteKeyModel from "@db/group_invite_key"

export default class GroupInvites {
	static get model() {
		return GroupInviteKeyModel
	}

	static get = getMethod.bind(this)
	static getAllByGroup = getAllByGroupMethod.bind(this)

	static create = createMethod.bind(this)
	static delete = deleteMethod.bind(this)
}
