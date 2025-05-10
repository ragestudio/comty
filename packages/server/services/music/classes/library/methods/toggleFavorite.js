import Library from ".."

import { MusicLibraryItem } from "@db_models"

export default async (user_id, item_id, kind, to) => {
	if (!user_id || !item_id || !kind) {
		throw new OperationError(400, "Missing user_id, item_id or kind")
	}

	kind = String(kind).toLowerCase()

	const availableKinds = Object.keys(Library.kindToModel)

	if (!availableKinds.includes(kind)) {
		throw new OperationError(400, `Invalid kind: ${kind}`)
	}

	const itemModel = Library.kindToModel[kind]

	// check if exists
	const itemObj = await itemModel.findOne({ _id: item_id }).catch(() => null)

	if (!itemObj) {
		throw new OperationError(404, `Item not found`)
	}

	// find library item
	let libraryItem = await MusicLibraryItem.findOne({
		user_id: user_id,
		item_id: item_id,
		kind: kind,
	}).catch(() => null)

	if (typeof to === "undefined") {
		to = !!!libraryItem
	}

	if (to == true && !libraryItem) {
		libraryItem = await MusicLibraryItem.create({
			user_id: user_id,
			item_id: item_id,
			kind: kind,
			created_at: Date.now(),
		})
	}

	if (to == false && libraryItem) {
		await MusicLibraryItem.deleteOne({
			_id: libraryItem._id.toString(),
		})
		libraryItem = null
	}

	return {
		liked: !!libraryItem,
		item_id: item_id,
		library_item_id: libraryItem ? libraryItem._id : null,
	}
}
