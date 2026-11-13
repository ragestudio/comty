import User from "@db_models/user"
import Inventory from "@shared-classes/Inventory"

const MAX_PROFILE_BADGES = 2

export default {
	useMiddlewares: ["withAuthentication"],
	fn: async (req) => {
		const userId = req.auth.session.user_id
		const payload = req.body ?? {}

		const profileBadges = payload.profile_badges ?? payload.badges

		if (!Array.isArray(profileBadges)) {
			throw new OperationError(400, "Invalid badges list")
		}

		const badges = profileBadges.map(String).filter(Boolean)

		if (badges.length > MAX_PROFILE_BADGES) {
			throw new OperationError(
				400,
				`You can only display up to ${MAX_PROFILE_BADGES} badges`,
			)
		}

		if (new Set(badges).size !== badges.length) {
			throw new OperationError(400, "Duplicated badges")
		}

		if (badges.length > 0) {
			const ownedEntries = await Inventory.owns(userId, "badge", badges)

			const owned = new Set(
				ownedEntries.map((entry) => String(entry.item_id)),
			)

			for (const badgeId of badges) {
				if (!owned.has(badgeId)) {
					throw new OperationError(403, "You do not own this badge")
				}
			}
		}

		const user = await User.findByIdAndUpdate(
			userId,
			{ profile_badges: badges },
			{ new: true },
		).lean()

		if (!user) {
			throw new OperationError(404, "User not found")
		}

		await Inventory.emitUserUpdate(userId)

		return {
			profile_badges: badges,
		}
	},
}
