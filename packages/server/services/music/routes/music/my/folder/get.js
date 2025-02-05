import { TrackLike } from "@db_models"

import TrackClass from "@classes/track"

const HANDLERS = {
	track: {
		model: TrackLike,
		class: TrackClass,
		type: "tracks",
		idField: "track_id",
	},
	// release: {
	//   model: ReleaseLike,
	//   class: ReleaseClass,
	//   type: 'releases',
	//   idField: 'release_id'
	// },
	// playlist: {
	//   model: PlaylistLike,
	//   class: PlaylistClass,
	//   type: 'playlists',
	//   idField: 'playlist_id'
	// },
}

async function getLikedItemsFromHandler(config, userId, pagination) {
	try {
		// obtain ids data and total items
		const [total, likes] = await Promise.all([
			config.model.countDocuments({ user_id: userId }),
			config.model
				.find({ user_id: userId })
				.sort({ created_at: -1 })
				.limit(pagination.limit)
				.skip(pagination.offset),
		])

		const likedAtMap = new Map()
		const itemIds = []

		for (const like of likes) {
			const itemId = like[config.idField]

			likedAtMap.set(itemId, like.created_at)
			itemIds.push(itemId)
		}

		// fetch track data
		let processedItems = await config.class.get(itemIds, {
			onlyList: true,
			minimalData: true,
		})

		// mix with likes data
		processedItems = processedItems.map((item) => {
			item.liked = true
			item.liked_at = likedAtMap.get(item._id.toString())
			return item
		})

		return {
			items: processedItems,
			total_items: total,
		}
	} catch (error) {
		console.error(`Error processing ${config.type}:`, error)
		return { items: [], total_items: 0 }
	}
}

//
// A endpoint to fetch track & playlists & releases likes
//
export default {
	middlewares: ["withAuthentication"],
	fn: async (req) => {
		const userId = req.auth.session.user_id
		const { limit = 50, offset = 0 } = req.query

		const activeHandlers = Object.values(HANDLERS)

		const results = await Promise.all(
			activeHandlers.map((handler) =>
				getLikedItemsFromHandler(handler, userId, { limit, offset }),
			),
		)

		return activeHandlers.reduce((response, handler, index) => {
			response[handler.type] = results[index]
			return response
		}, {})
	},
}
