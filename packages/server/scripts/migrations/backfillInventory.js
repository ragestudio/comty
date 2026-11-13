import EnvLoad from "@linebridge/cli/libs/env.mjs"
import InfisicalLib from "@linebridge/cli/libs/infisical.mjs"

import DbManager from "@shared-classes/DbManager"

import User from "@db_models/user"
import Decoration from "@db_models/decorations"
import Badge from "@db_models/badge"
import InventoryItem from "@db_models/inventoryItem"

async function main() {
	EnvLoad()
	await InfisicalLib.LoadFromEnv()

	const db = new DbManager()
	await db.initialize()

	const decorations = await Decoration.find({
		enabled: { $ne: false },
	}).lean()

	const decorationsById = new Map(
		decorations.map((decoration) => [String(decoration._id), decoration]),
	)

	const badges = await Badge.find({ enabled: { $ne: false } }).lean()

	const badgesByName = new Map(badges.map((badge) => [badge.name, badge]))

	const badgesById = new Map(
		badges.map((badge) => [String(badge._id), badge]),
	)

	const users = await User.find({}).select("+badges").lean()

	const stats = {
		users: users.length,
		decorations: 0,
		badges: 0,
		skippedDecorations: 0,
		skippedBadges: 0,
		cleanedProfiles: 0,
	}

	for (const user of users) {
		const userId = String(user._id)

		const userDecorations = { ...(user.decorations ?? {}) }
		let decorationsChanged = false

		for (const [slot, decorationId] of Object.entries(userDecorations)) {
			const id = String(decorationId)

			if (!decorationsById.has(id)) {
				delete userDecorations[slot]
				decorationsChanged = true
				stats.skippedDecorations++
				continue
			}

			await InventoryItem.updateOne(
				{
					user_id: userId,
					kind: "decoration",
					item_id: id,
				},
				{
					$setOnInsert: {
						user_id: userId,
						kind: "decoration",
						item_id: id,
						source: "migration",
						granted_at: new Date(),
						metadata: { slot },
					},
				},
				{ upsert: true },
			)

			stats.decorations++
		}

		const badgeNames = Array.isArray(user.badges) ? user.badges : []
		const ownedBadges = []

		for (const badgeName of badgeNames) {
			const badge = badgesByName.get(badgeName)

			if (!badge) {
				stats.skippedBadges++
				continue
			}

			const badgeId = String(badge._id)

			await InventoryItem.updateOne(
				{
					user_id: userId,
					kind: "badge",
					item_id: badgeId,
				},
				{
					$setOnInsert: {
						user_id: userId,
						kind: "badge",
						item_id: badgeId,
						source: "migration",
						granted_at: new Date(),
					},
				},
				{ upsert: true },
			)

			if (!ownedBadges.includes(badgeId)) {
				ownedBadges.push(badgeId)
			}

			stats.badges++
		}

		const update = {}

		const profileBadgeIds = Array.isArray(user.profile_badges)
			? user.profile_badges.map(String)
			: []

		const validProfileBadges = []

		for (const badgeId of profileBadgeIds) {
			const badge = badgesById.get(badgeId)

			if (!badge) {
				stats.skippedBadges++
				continue
			}

			validProfileBadges.push(badgeId)

			await InventoryItem.updateOne(
				{
					user_id: userId,
					kind: "badge",
					item_id: badgeId,
				},
				{
					$setOnInsert: {
						user_id: userId,
						kind: "badge",
						item_id: badgeId,
						source: "migration",
						granted_at: new Date(),
					},
				},
				{ upsert: true },
			)
		}

		if (decorationsChanged) {
			update.decorations = userDecorations
		}

		if (validProfileBadges.length !== profileBadgeIds.length) {
			update.profile_badges = validProfileBadges.slice(0, 2)
		}

		if (
			ownedBadges.length > 0 &&
			(!Array.isArray(user.profile_badges) ||
				user.profile_badges.length === 0)
		) {
			update.profile_badges = ownedBadges.slice(0, 2)
		}

		if (Object.keys(update).length > 0) {
			await User.updateOne({ _id: user._id }, update)
			stats.cleanedProfiles++
		}
	}

	console.log(stats)
	process.exit(0)
}

main()
