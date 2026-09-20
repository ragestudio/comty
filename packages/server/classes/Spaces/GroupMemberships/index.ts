import createMethod from "./methods/create"
import deleteMethod from "./methods/delete"

import getMethod from "./methods/get"
import getOneById from "./methods/getOneById"
import getOneByUserId from "./methods/getOneByUserId"

import getAllByGroupIdMethod from "./methods/getByGroupId"
import getAllByUserIdMethod from "./methods/getByUserId"

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
	static getOneById = getOneById.bind(this) as OmitThisParameter<
		typeof getOneById
	>
	static getOneByUserId = getOneByUserId.bind(this) as OmitThisParameter<
		typeof getOneByUserId
	>

	static getAllByGroupId = getAllByGroupIdMethod.bind(
		this,
	) as OmitThisParameter<typeof getAllByGroupIdMethod>
	static getAllByUserId = getAllByUserIdMethod.bind(
		this,
	) as OmitThisParameter<typeof getAllByUserIdMethod>
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
