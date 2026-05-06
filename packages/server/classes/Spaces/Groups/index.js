import getMethod from "./methods/get"
import getManyMethod from "./methods/getMany"
import getManyByJoinedUserIdMethod from "./methods/getManyByJoinedUserId"
import createMethod from "./methods/create"
import updateMethod from "./methods/update"
import deleteMethod from "./methods/delete"
import canUserIdReachMethod from "./methods/canUserIdReach"
import sortMerthod from "./methods/sort"

import GroupsModel from "@db/groups"
import GroupsUserOrdersModel from "@db/groups_user_orders"
import GroupInviteKeyModel from "@db/group_invite_key"

export default class Groups {
	static get model() {
		return GroupsModel
	}
	static get sortModel() {
		return GroupsUserOrdersModel
	}
	static get inviteKeyModel() {
		return GroupInviteKeyModel
	}

	static get = getMethod.bind(this)
	static getMany = getManyMethod.bind(this)
	static getManyByJoinedUserId = getManyByJoinedUserIdMethod.bind(this)

	static create = createMethod.bind(this)
	static update = updateMethod.bind(this)
	static delete = deleteMethod.bind(this)

	static canUserIdReach = canUserIdReachMethod.bind(this)
	static sort = sortMerthod.bind(this)
}
