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

	static get = getMethod.bind(this) as OmitThisParameter<typeof getMethod>
	static getByGroupId = getByGroupIdMethod.bind(this) as OmitThisParameter<
		typeof getByGroupIdMethod
	>
	static getByUserId = getByUserIdMethod.bind(this) as OmitThisParameter<
		typeof getByUserIdMethod
	>
	static getTotalMembersByGroupId = getTotalMembersByGroupIdMethod.bind(
		this,
	) as OmitThisParameter<typeof getTotalMembersByGroupIdMethod>

	static create = createMethod.bind(this) as OmitThisParameter<
		typeof createMethod
	>
	static delete = deleteMethod.bind(this) as OmitThisParameter<
		typeof deleteMethod
	>

	static isUserIdOnMembers = isUserIdOnMembersMethod.bind(
		this,
	) as OmitThisParameter<typeof isUserIdOnMembersMethod>
}
