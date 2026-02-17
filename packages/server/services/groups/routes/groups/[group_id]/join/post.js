import Groups from "@shared-classes/Spaces/Groups"
import GroupInvites from "@shared-classes/Spaces/GroupInvites"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default {
	useMiddlewares: ["botAuthentication", "withAuthentication"],
	fn: async (req) => {
		const { group_id } = req.params
		const { invite_key } = req.body

		if (!invite_key) {
			throw new OperationError(400, "invite_key is required")
		}

		// first check if group exist
		const group = await Groups.get(group_id, { raw: false })

		if (!group) {
			throw new OperationError(404, "Group not found")
		}

		// check if is already joined
		let membership = await GroupMemberships.isUserIdOnMembers(
			req.auth.user_id,
			group_id,
		)

		if (membership) {
			return {
				already_member: true,
			}
		}

		// check if invite key is valid
		const invite = await GroupInvites.get(group, invite_key, { raw: false })

		if (!invite) {
			throw new OperationError(404, "Invite not found")
		}

		// check if invite is expired
		if (
			typeof invite.expired_at !== "undefined" &&
			invite.expired_at < Date.now()
		) {
			throw new OperationError(400, "Invite expired")
		}

		// check is usages limit reached
		if (
			typeof invite.max_usage !== "undefined" &&
			invite.usages >= invite.max_usage
		) {
			throw new OperationError(400, "Invite usages limit reached")
		}

		// create the membership
		membership = await GroupMemberships.create(
			group._id.toString(),
			req.auth.user_id,
		)

		// increment usages
		invite.usages++

		// save the invite
		await invite.saveAsync()

		return membership
	},
}
