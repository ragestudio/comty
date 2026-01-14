import getMethod from "./methods/get"
import getManyMethod from "./methods/getMany"
import getManyByJoinedUserIdMethod from "./methods/getManyByJoinedUserId"
import createMethod from "./methods/create"
import updateMethod from "./methods/update"
import deleteMethod from "./methods/delete"
import canUserIdReachMethod from "./methods/canUserIdReach"

export default class Groups {
	static get model() {
		return global.scylla.model("groups")
	}
	static get inviteKeyModel() {
		return global.scylla.model("group_invite_key")
	}

	static get = getMethod.bind(this)
	static getMany = getManyMethod.bind(this)
	static getManyByJoinedUserId = getManyByJoinedUserIdMethod.bind(this)

	static create = createMethod.bind(this)
	static update = updateMethod.bind(this)
	static delete = deleteMethod.bind(this)

	static canUserIdReach = canUserIdReachMethod.bind(this)
}
