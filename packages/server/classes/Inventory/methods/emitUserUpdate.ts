import type Inventory from "../index"

import User from "@db_models/user"
import GroupMemberships from "@shared-classes/Spaces/GroupMemberships"

export default async function (
	this: typeof Inventory,
	user_id: string,
): Promise<Record<string, any> | null> {
	if (!global.websockets) return null

	const user = await User.findById(user_id).lean()

	if (!user) return null

	const payload = {
		...user,
		decorations: await this.hydrateDecorations(user.decorations),
	}

	const userSockets = await global.websockets.find.clientsByUserId(
		String(user._id),
	)

	for (const userSocket of userSockets) {
		userSocket.emit("self:user:update", payload)
	}

	try {
		const memberships = await GroupMemberships.getAllByUserId(
			String(user._id),
		)

		const groupIds = [
			...new Set(
				memberships
					.map((membership) => String(membership.group_id))
					.filter(Boolean),
			),
		]

		await Promise.allSettled(
			groupIds.map((groupId) =>
				global.websockets.senders.toTopic(
					`group:${groupId}`,
					`group:${groupId}:user:profile`,
					{
						user_id: String(user._id),
						decorations: payload.decorations,
						profile_badges: user.profile_badges ?? [],
					},
				),
			),
		)
	} catch (error) {
		console.error("Failed to broadcast user profile update", error)
	}

	return payload
}
