import type { Group, MetaGroup } from "@comty/shared/types/spaces/group"
import type { PaginatedResponse } from "@comty/shared/types/pagination"

import * as v from "valibot"
import { Validate } from "../../decorators/Validate"
import { Definition } from "../../decorators/Definition"

import Model from "../../model"

import Members from "./members"
import Channels from "./channels"
import Invites from "./invites"
import Soundpad from "./soundpad"
import Rtc from "./rtc"

class GroupsModel extends Model {
	/**
	 * Get all groups the user is a member of
	 */
	@Definition(() => ({ method: "GET", url: `/groups/my` }))
	getMy!: () => Promise<PaginatedResponse<Group>>

	/**
	 * Create a new group
	 */
	@Validate(v.object({}))
	@Definition((payload) => ({
		method: "POST",
		url: "/groups/create",
		data: payload,
	}))
	create!: (payload: Partial<Group>) => Promise<Group>

	/**
	 * Get a group by ID
	 */
	@Validate(v.pipe(v.string(), v.minLength(1, "group_id is required")))
	@Definition((group_id) => ({ method: "GET", url: `/groups/${group_id}` }))
	get!: (group_id: string) => Promise<Group>

	/**
	 * Modify a group
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.object({}),
	)
	@Definition((group_id, payload) => ({
		method: "PUT",
		url: `/groups/${group_id}`,
		data: payload,
	}))
	modify!: (group_id: string, payload: Partial<Group>) => Promise<Group>

	/**
	 * Delete a group
	 */
	@Validate(v.pipe(v.string(), v.minLength(1, "group_id is required")))
	@Definition((group_id) => ({
		method: "DELETE",
		url: `/groups/${group_id}`,
	}))
	delete!: (group_id: string) => Promise<{ success: boolean }>

	/**
	 * Sort groups
	 */
	@Validate(v.array(v.string()))
	@Definition((payload) => ({
		method: "PUT",
		url: `/groups/my/sort`,
		data: payload,
	}))
	sort!: (payload: string[]) => Promise<{ success: boolean }>

	/**
	 * Leave a group
	 */
	@Validate(v.pipe(v.string(), v.minLength(1, "group_id is required")))
	@Definition((group_id) => ({
		method: "POST",
		url: `/groups/${group_id}/leave`,
	}))
	leave!: (group_id: string) => Promise<{ success: boolean }>

	/**
	 * Get group meta
	 */
	@Validate(v.pipe(v.string(), v.minLength(1, "group_id is required")))
	@Definition((group_id) => ({
		method: "GET",
		url: `/groups/${group_id}/meta`,
	}))
	meta!: (group_id: string) => Promise<MetaGroup>

	members = Members
	channels = Channels
	invites = Invites
	soundpad = Soundpad
	rtc = Rtc
}

export default new GroupsModel()
