import Groups from "@classes/Groups"

// TODO: User the permissions api
export default class GroupMemberships {
	static get model() {
		return global.scylla.model("group_memberships")
	}

	static async getTotalMembersByGroupId(group_id) {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const memberships = await this.model.findAsync({
			group_id: group_id,
		})

		return memberships.length
	}

	static async getByGroupId(group_id, { limit, offset } = {}) {
		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const query = {
			group_id: group_id,
		}

		if (limit) {
			query.$limit = parseInt(limit)
		}

		if (offset) {
			query._id = {
				$lt: offset,
			}
		}

		const memberships = await this.model.findAsync(query)

		return memberships
	}

	static async getByUserId(user_id, { limit, offset } = {}) {
		if (typeof user_id !== "string") {
			throw new OperationError(400, "user_id must be a string")
		}

		const query = {
			user_id: user_id,
		}

		if (limit) {
			query.$limit = parseInt(limit)
		}

		if (offset) {
			query._id = {
				$lt: offset,
			}
		}

		const memberships = await this.model.findAsync(query)

		return memberships
	}

	static async create(user_id, group_id) {
		if (typeof user_id !== "string") {
			throw new OperationError(400, "user_id must be a string")
		}

		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		// check if is already a member
		if (await this.isUserIdOnMembers(user_id, group_id)) {
			throw new OperationError(400, "User is already a member")
		}

		const _id = global.snowflake.nextId().toString()
		const created_at = new Date().toISOString()

		const membership = new this.model({
			_id: _id,
			user_id: user_id,
			group_id: group_id,
			created_at: created_at,
		})

		await membership.saveAsync()

		return membership.toJSON()
	}

	static async delete(membership_id, group_id, issuer_user_id) {
		if (typeof user_id !== "string") {
			throw new OperationError(400, "user_id must be a string")
		}

		if (typeof group_id !== "string") {
			throw new OperationError(400, "group_id must be a string")
		}

		const group = await Groups.model.findOneAsync({
			_id: group_id,
		})

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		const membership = await this.model.findOneAsync({
			_id: membership_id,
		})

		if (!membership) {
			throw new OperationError(404, "Membership not found")
		}

		if (typeof issuer_user_id === "string") {
			if (membership.user_id !== issuer_user_id) {
				if (group.owner_user_id !== issuer_user_id) {
					throw new OperationError(
						403,
						"You are not allowed to delete this membership",
					)
				}
			}
		}

		await membership.deleteAsync()
	}

	static async isUserIdOnMembers(user_id, group_id) {
		const membership = await this.model.findOneAsync(
			{
				user_id: user_id,
				group_id: group_id,
			},
			{
				raw: true,
			},
		)

		return !!membership
	}
}
