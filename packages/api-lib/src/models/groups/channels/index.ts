import type { Channel, Channels } from "@comty/shared/types/spaces/channel"

import * as v from "valibot"
import { Validate } from "../../../decorators/Validate"
import { Definition } from "../../../decorators/Definition"

import Model from "../../../model"

class GroupChannels extends Model {
	/**
	 * List all channels for a given group_id
	 */
	@Validate(v.pipe(v.string(), v.minLength(1, "group_id is required")))
	@Definition((group_id, { limit = 50, offset = null } = {}) => ({
		method: "GET",
		url: `/groups/${group_id}/channels`,
		params: { limit, offset },
	}))
	list!: (
		group_id: string,
		opts?: { limit?: number; offset?: number | null },
	) => Promise<Channels>

	/**
	 * Get a channel by group_id and channel_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.pipe(v.string(), v.minLength(1, "channel_id is required")),
	)
	@Definition((group_id, channel_id) => ({
		method: "GET",
		url: `/groups/${group_id}/channels/${channel_id}`,
	}))
	get!: (group_id: string, channel_id: string) => Promise<Channel>

	/**
	 * Create a new channel for a given group_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.object({}),
	)
	@Definition((group_id, payload) => ({
		method: "POST",
		url: `/groups/${group_id}/channels/create`,
		data: payload,
	}))
	create!: (group_id: string, payload: Partial<Channel>) => Promise<Channel>

	/**
	 * Update the order of channels for a given group_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.array(v.pipe(v.string(), v.minLength(1))),
	)
	@Definition((group_id, order) => ({
		method: "POST",
		url: `/groups/${group_id}/channels/order`,
		data: { order },
	}))
	order!: (group_id: string, order: string[]) => Promise<{ success: boolean }>

	channel = new ChannelMethods()
}

class ChannelMethods extends Model {
	/**
	 * Modify a channel by group_id and channel_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.pipe(v.string(), v.minLength(1, "channel_id is required")),
		v.object({}),
	)
	@Definition(
		(group_id: string, channel_id: string, payload: Partial<Channel>) => ({
			method: "PUT",
			url: `/groups/${group_id}/channels/${channel_id}`,
			data: payload,
		}),
	)
	modify!: (
		group_id: string,
		channel_id: string,
		payload: Partial<Channel>,
	) => Promise<Channel>

	/**
	 * Delete a channel by group_id and channel_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.pipe(v.string(), v.minLength(1, "channel_id is required")),
		v.object({}),
	)
	@Definition((group_id: string, channel_id: string) => ({
		method: "DELETE",
		url: `/groups/${group_id}/channels/${channel_id}`,
	}))
	delete!: (group_id: string, channel_id: string) => Promise<Channel>

	/**
	 * Disconnect a user from a rtc channel by group_id, channel_id, and user_id
	 */
	@Validate(
		v.pipe(v.string(), v.minLength(1, "group_id is required")),
		v.pipe(v.string(), v.minLength(1, "channel_id is required")),
		v.pipe(v.string(), v.minLength(1, "user_id is required")),
	)
	@Definition((group_id: string, channel_id: string, user_id: string) => ({
		method: "POST",
		url: `/rtc/groups/${group_id}/${channel_id}/${user_id}/disconnect`,
	}))
	disconnectUser!: (
		group_id: string,
		channel_id: string,
		user_id: string,
	) => Promise<Channel>
}

export default new GroupChannels()
