import type { GroupInviteKey } from "@comty/shared/db/group_invite_key"
import type { PaginatedResponse } from "@comty/shared/types/pagination"

import * as v from "valibot"
import { Validate } from "../../../decorators/Validate"
import { Definition } from "../../../decorators/Definition"

import Model from "../../../model"

class GroupInvites extends Model {
	/**
	 * Get a group invite data by group_id and invite_key
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.pipe(v.string(), v.minLength(1, "invite_key is required")),
	)
	@Definition((group_id, invite_key, { fetchData = false } = {}) => ({
		method: "GET",
		url: `/groups/${group_id}/invites/${invite_key}`,
		params: { fetch: fetchData },
	}))
	get!: (
		group_id: string,
		invite_key: string,
		opts?: { fetchData?: boolean },
	) => Promise<GroupInviteKey>

	/**
	 * Get all group invites for a given group_id
	 */
	@Validate(v.pipe(v.string(), v.minLength(1, "group_id is required")))
	@Definition((group_id) => ({
		method: "GET",
		url: `/groups/${group_id}/invites`,
	}))
	getAll!: (group_id: string) => Promise<PaginatedResponse<GroupInviteKey>>

	/**
	 * Create a new group invite for a given group_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.object({}),
	)
	@Definition((group_id, payload) => ({
		method: "POST",
		url: `/groups/${group_id}/invites/create`,
		data: payload,
	}))
	create!: (
		group_id: string,
		payload: Partial<GroupInviteKey>,
	) => Promise<GroupInviteKey>

	/**
	 * Join a group using an invite key
	 */
	@Validate(
		v.object({
			group_id: v.pipe(v.string(), v.minLength(1)),
			invite_key: v.pipe(v.string(), v.minLength(1)),
		}),
	)
	@Definition(({ group_id, invite_key }) => ({
		method: "POST",
		url: `groups/${group_id}/join`,
		data: { invite_key },
	}))
	join!: (payload: {
		group_id: string
		invite_key: string
	}) => Promise<{ success: boolean }>

	/**
	 * Delete a group invite by group_id and invite_key
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.pipe(v.string(), v.minLength(1, "invite_key is required")),
	)
	@Definition((group_id, invite_key) => ({
		method: "DELETE",
		url: `/groups/${group_id}/invites/${invite_key}`,
	}))
	delete!: (
		group_id: string,
		invite_key: string,
	) => Promise<{ success: boolean }>
}

export default new GroupInvites()
