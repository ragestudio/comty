import createMethod from "./methods/create"
import deleteMethod from "./methods/delete"
import getMethod from "./methods/get"
import getByGroupIdMethod from "./methods/getByGroupId"
import getByUserIdMethod from "./methods/getByUserId"
import getTotalMembersByGroupIdMethod from "./methods/getTotalMembersByGroupId"
import isUserIdOnMembersMethod from "./methods/isUserIdOnMembers"

import GroupMembershipsModel from "@db/group_memberships"
import GroupMembershipsRefModel from "@db/group_memberships_ref"
import GroupMembershipsCounterModel from "@db/group_memberships_counter"

export default class GroupMemberships {
	static get model() {
		return GroupMembershipsModel
	}
	static get modelRef() {
		return GroupMembershipsRefModel
	}
	static get modelCounter() {
		return GroupMembershipsCounterModel
	}

	static get = getMethod.bind(this)
	static getByGroupId = getByGroupIdMethod.bind(this)
	static getByUserId = getByUserIdMethod.bind(this)
	static getTotalMembersByGroupId = getTotalMembersByGroupIdMethod.bind(this)

	static create = createMethod.bind(this)
	static delete = deleteMethod.bind(this)

	static isUserIdOnMembers = isUserIdOnMembersMethod.bind(this)
}
