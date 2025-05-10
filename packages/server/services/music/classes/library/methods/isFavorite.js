import { MusicLibraryItem } from "@db_models"

export default async (user_id, item_id, kind) => {
	if (!user_id) {
		throw new OperationError(400, "Missing user_id")
	}

	if (!item_id) {
		throw new OperationError(400, "Missing item_id")
	}

	if (Array.isArray(item_id)) {
		const libraryItems = await MusicLibraryItem.find({
			user_id: user_id,
			item_id: { $in: item_id },
			kind: kind,
		})
			.lean()
			.catch(() => {
				return []
			})

		return item_id.map((id) => {
			const libItem = libraryItems.find(
				(item) => item.item_id.toString() === id.toString(),
			)

			return {
				item_id: id,
				liked: !!libItem,
				created_at: libItem?.created_at,
			}
		})
	} else {
		let libraryItem = await MusicLibraryItem.findOne({
			user_id: user_id,
			item_id: item_id,
			kind: kind,
		}).catch(() => null)

		return {
			liked: !!libraryItem,
		}
	}
}
