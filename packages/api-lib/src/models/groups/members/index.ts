import * as v from "valibot"
import { Validate } from "../../../decorators/Validate"
import type { Member, Members } from "@comty/shared/types/spaces/member"
import type { UserPresenceConnection } from "@comty/shared/types/user"

import Model from "../../../model"
import { Definition } from "../../../decorators/Definition"

class GroupMembers extends Model {
	/**
	 * List all members of a group
	 */
	@Validate(v.pipe(v.string(), v.minLength(1, "group_id is required")))
	@Definition((group_id, { limit = 50, offset = null } = {}) => ({
		method: "GET",
		url: `/groups/${group_id}/members`,
		params: { limit, offset },
	}))
	list!: (
		group_id: string,
		opts?: { limit?: number; offset?: number | null },
	) => Promise<Members>

	/**
	 * Get a member by membership_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.pipe(v.string(), v.minLength(1, "membership_id is required")),
	)
	@Definition((group_id, membership_id) => ({
		method: "GET",
		url: `/groups/${group_id}/members/${membership_id}`,
	}))
	get!: (group_id: string, membership_id: string) => Promise<Member>

	/**
	 * Remove a member from a group by member_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.pipe(v.string(), v.minLength(1, "member_id is required")),
	)
	@Definition((group_id, member_id) => ({
		method: "DELETE",
		url: `/groups/${group_id}/members/${member_id}`,
	}))
	remove!: (group_id: string, member_id: string) => Promise<Member>

	/**
	 * Get connections for a group by user_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.array(v.pipe(v.string(), v.minLength(1))),
	)
	@Definition((group_id, users_id) => ({
		method: "GET",
		url: `/groups/${group_id}/members/connections`,
		params: { users_id: users_id.join(",") },
	}))
	connections!: (
		group_id: string,
		users_id: string[],
	) => Promise<UserPresenceConnection[]>
}

export default new GroupMembers()
