import GroupMemberships from "@classes/GroupMemberships"
import GroupChannels from "@classes/GroupChannels"
import GroupPermissions from "@classes/GroupPermissions"

export default class Groups {
	static get model() {
		return global.scylla.model("groups")
	}

	static get channelOrderModel() {
		return global.scylla.model("channel_orders")
	}

	static async get(group_id) {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const group = await this.model.findOneAsync(
			{
				_id: group_id,
			},
			{
				raw: true,
			},
		)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		return group
	}

	static async getMany(group_ids) {
		if (!Array.isArray(group_ids)) {
			throw new OperationError(400, "group_ids must be an array")
		}

		let groups = await this.model.findAsync(
			{
				_id: {
					$in: group_ids,
				},
			},
			{
				raw: true,
			},
		)

		return groups
	}

	static async getManyByJoinedUserId(user_id) {
		if (typeof user_id !== "string") {
			throw new OperationError(400, "user_id must be a string")
		}

		const memberships = await GroupMemberships.getByUserId(user_id)

		if (memberships.length === 0) {
			return []
		}

		const groups = await this.getMany(
			memberships.map((membership) => membership.group_id),
		)

		return groups
	}

	static async create(payload) {
		if (!payload.name || payload.name.length < 3) {
			throw new OperationError(
				400,
				"Group `name` is missing or too short",
			)
		}

		const groupId = global.snowflake.nextId().toString()
		const created_at = new Date().toISOString()

		const group = new this.model({
			_id: groupId,
			name: payload.name,
			description: payload.description,
			icon: payload.icon,
			cover: payload.cover,
			owner_user_id: payload.owner_user_id,
			reachability: payload.reachability,
			created_at: created_at,
		})

		await group.saveAsync()

		// create the membership
		await GroupMemberships.create(payload.owner_user_id, groupId)

		// create the general text channel
		await GroupChannels.create(
			groupId,
			{
				kind: "chat",
				name: "General",
			},
			payload.owner_user_id,
		)

		return group.toJSON()
	}

	static async update(group_id, payload, issuer_user_id) {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const group = await this.model.findOneAsync({
			_id: group_id,
		})

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (typeof issuer_user_id === "string") {
			if (group.owner_user_id !== issuer_user_id) {
				throw new OperationError(
					403,
					"You are not allowed to update this group",
				)
			}
		}

		if (payload.name) {
			group.name = payload.name
		}

		if (payload.description) {
			group.description = payload.description
		}

		if (payload.icon) {
			group.icon = payload.icon
		}

		if (payload.cover) {
			group.cover = payload.cover
		}

		if (payload.reachability) {
			group.reachability = payload.reachability
		}

		await group.saveAsync()

		return group
	}

	static async delete(group_id, issuer_user_id) {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const group = await this.get(group_id)

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		if (typeof issuer_user_id === "string") {
			if (group.owner_user_id !== issuer_user_id) {
				throw new OperationError(
					403,
					"You are not allowed to delete this group",
				)
			}
		}

		// delete the memberships
		const memberships = await GroupMemberships.getByGroupId(group_id)

		for (const membership of memberships) {
			await membership.deleteAsync()
		}

		// delete the channels
		const channels = await GroupChannels.getByGroupId(group_id)

		for (const channel of channels) {
			await channel.deleteAsync()
		}

		await this.model.deleteAsync({ _id: group_id })

		return group
	}

	static async canUserIdReach(user_id, group_id) {
		if (typeof user_id !== "string") {
			throw new OperationError(400, "user_id must be a string")
		}

		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		// lookup for the group
		const group = await this.get(group_id, {
			basic: false,
		})

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		// check if group is public
		if (group.reachability === "public") {
			return group
		}

		// check if the user is the owner or is in the memberships
		const isMember = await GroupMemberships.isUserIdOnMembers(
			user_id,
			group_id,
		)

		if (!isMember) {
			throw new OperationError(403, "You are not a member of this group")
		}

		return group
	}

	static async orderChannels(group_id, order_ids, user_id) {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		if (!Array.isArray(order_ids)) {
			throw new OperationError(400, "order_ids must be an array")
		}

		if (typeof user_id === "string") {
			if (
				!(await GroupPermissions.hasUserPermission(
					user_id,
					group_id,
					"order_channels",
				))
			) {
				throw new OperationError(
					403,
					"You are not allowed to order channels in this group",
				)
			}
		}

		console.log("Updating group channels order", {
			group_id,
			newOrder: order_ids,
		})

		let group = await this.channelOrderModel.updateAsync(
			{ group_id: group_id },
			{
				order: order_ids,
			},
		)

		return group
	}
}
