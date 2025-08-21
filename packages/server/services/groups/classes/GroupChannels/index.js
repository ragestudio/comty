import GroupPermissions from "@classes/GroupPermissions"

export default class GroupChannels {
	static get model() {
		return global.scylla.model("group_channels")
	}

	static kinds = {
		chat: "chat",
		voice: "voice",
	}

	static async get(group_id, channel_id, user_id) {
		if (typeof channel_id !== "string") {
			throw new OperationError(400, "channel_id must be a string")
		}

		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const channel = await this.model.findOneAsync({
			group_id: group_id,
			_id: channel_id,
		})

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		if (typeof user_id === "string") {
			// check if the user is allowed to read the channel
			if (
				!(await GroupPermissions.hasUserPermission(
					user_id,
					channel.group_id,
					"read_channel",
				))
			) {
				throw new OperationError(
					403,
					"You are not allowed to read this channel",
				)
			}
		}

		return channel
	}

	static async getByGroupId(group_id, user_id) {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		if (typeof user_id === "string") {
			// check if the user is allowed to read the channel
			if (
				!(await GroupPermissions.hasUserPermission(
					user_id,
					group_id,
					"read_channel",
				))
			) {
				throw new OperationError(
					403,
					"You are not allowed to read this channel",
				)
			}
		}

		console.time("find channels:")
		const channels = await this.model.findAsync({
			group_id,
		})
		console.timeEnd("find channels:")

		return channels
	}

	static async create(group_id, payload, user_id) {
		if (!payload.name || payload.name.length < 3) {
			throw new OperationError(
				400,
				"Channel `name` is missing or too short",
			)
		}

		if (typeof payload.kind !== "string") {
			throw new OperationError(400, "Channel `kind` is missing")
		}

		if (!this.kinds[payload.kind]) {
			throw new OperationError(400, "Channel `kind` is not valid")
		}

		// if user_id is provided, check if the user has permissions to create a channel
		if (typeof user_id === "string") {
			if (
				!(await GroupPermissions.hasUserPermission(
					user_id,
					group_id,
					"create_channel",
				))
			) {
				throw new OperationError(
					403,
					"You are not allowed to create a channel in this group",
				)
			}
		}

		const channelId = global.snowflake.nextId().toString()
		const created_at = new Date().toISOString()

		const channel = new this.model({
			_id: channelId,
			group_id: group_id,
			kind: payload.kind,
			name: payload.name,
			description: payload.description,
			params: payload.params,
			created_at: created_at,
		})

		await channel.saveAsync()

		return channel.toJSON()
	}

	static async update(group_id, channel_id, payload, user_id) {
		if (typeof channel_id !== "string") {
			throw new OperationError(400, "channel_id must be a string")
		}

		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const channel = await this.get(group_id, channel_id)

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		if (typeof user_id === "string") {
			if (
				!(await GroupPermissions.hasUserPermission(
					user_id,
					channel.group_id,
					"update_channel",
				))
			) {
				throw new OperationError(
					403,
					"You are not allowed to create a channel in this group",
				)
			}
		}

		if (payload.name && payload.name.length > 3) {
			channel.name = payload.name
		}

		if (payload.description) {
			channel.description = payload.description
		}

		if (payload.params) {
			channel.params = payload.params
		}

		await channel.saveAsync()

		return channel
	}

	static async delete(group_id, channel_id, user_id) {
		if (typeof channel_id !== "string") {
			throw new OperationError(400, "channel_id must be a string")
		}

		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const channel = await this.get(group_id, channel_id)

		if (!channel) {
			throw new OperationError(404, "Channel not found")
		}

		if (typeof user_id === "string") {
			if (
				!(await GroupPermissions.hasUserPermission(
					user_id,
					channel.group_id,
					"delete_channel",
				))
			) {
				throw new OperationError(
					403,
					"You are not allowed to create a channel in this group",
				)
			}
		}

		await channel.deleteAsync()

		return channel
	}
}
