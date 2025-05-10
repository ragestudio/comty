import { MusicLibraryItem } from "@db_models"

import Library from ".."

async function fetchSingleKindData(userId, kind, limit, offsetStr) {
	const Model = Library.kindToModel[kind]
	const parsedOffset = parseInt(offsetStr, 10)

	// this should be redundant if the initial check in `fn` was already done,
	// but its a good safeguard.
	if (!Model) {
		console.warn(`Model not found for kind: ${kind} in fetchSingleKindData`)
		return { items: [], total_items: 0, offset: parsedOffset }
	}

	const query = { user_id: userId, kind: kind }

	const libraryItems = await MusicLibraryItem.find(query)
		.limit(limit)
		.skip(parsedOffset)
		.sort({ created_at: -1 })
		.lean()

	if (libraryItems.length === 0) {
		// we get total_items even if the current page is empty,
		// as there might be items on other pages.
		const total_items = await MusicLibraryItem.countDocuments(query)
		return { items: [], total_items: total_items, offset: parsedOffset }
	}

	const total_items = await MusicLibraryItem.countDocuments(query)

	const itemIds = libraryItems.map((item) => item.item_id)
	const actualItems = await Model.find({ _id: { $in: itemIds } }).lean()
	const actualItemsMap = new Map(
		actualItems.map((item) => [item._id.toString(), item]),
	)

	const enrichedItems = libraryItems
		.map((libraryItem) => {
			const actualItem = actualItemsMap.get(
				libraryItem.item_id.toString(),
			)
			if (actualItem) {
				return {
					...actualItem,
					liked: true,
					liked_at: libraryItem.created_at,
					library_item_id: libraryItem._id,
				}
			}
			console.warn(
				`Actual item not found for kind ${kind} with ID ${libraryItem.item_id}`,
			)
			return null
		})
		.filter((item) => item !== null)

	return {
		items: enrichedItems,
		total_items: total_items,
		offset: parsedOffset,
	}
}

async function fetchAllKindsData(userId, limit, offsetStr) {
	const parsedOffset = parseInt(offsetStr, 10)
	const baseQuery = { user_id: userId }

	// initialize the result structure for all kinds
	const resultForAllKinds = {}
	for (const kindName in Library.kindToModel) {
		resultForAllKinds[kindName] = {
			items: [],
			total_items: 0,
			offset: parsedOffset,
		}
	}

	// get the paginated MusicLibraryItems
	const paginatedLibraryItems = await MusicLibraryItem.find(baseQuery)
		.limit(limit)
		.skip(parsedOffset)
		.sort({ created_at: -1 })
		.lean()

	// group MusicLibraryItems and collect item_ids by kind
	const libraryItemsGroupedByKind = {} // contain MusicLibraryItem objects
	const itemIdsToFetchByKind = {} // contain arrays of item_id

	for (const kindName in Library.kindToModel) {
		libraryItemsGroupedByKind[kindName] = []
		itemIdsToFetchByKind[kindName] = []
	}

	paginatedLibraryItems.forEach((libItem) => {
		if (
			Library.kindToModel[libItem.kind] &&
			libraryItemsGroupedByKind[libItem.kind]
		) {
			libraryItemsGroupedByKind[libItem.kind].push(libItem)
			itemIdsToFetchByKind[libItem.kind].push(libItem.item_id)
		} else {
			console.warn(`Unknown or unhandled kind found: ${libItem.kind}`)
		}
	})

	// fetch the actual item data for each kind in parallel
	const detailFetchPromises = Object.keys(itemIdsToFetchByKind).map(
		async (currentKind) => {
			const itemIds = itemIdsToFetchByKind[currentKind]

			if (itemIds.length === 0) {
				return // no items of this kind on the current page
			}

			const Model = Library.kindToModel[currentKind]

			// the check for Library.kindToModel[currentKind] was already done when populating itemIdsToFetchByKind
			// so Model should be defined here if itemIds.length > 0.
			const actualItems = await Model.find({
				_id: { $in: itemIds },
			}).lean()
			const actualItemsMap = new Map(
				actualItems.map((item) => [item._id.toString(), item]),
			)

			// enrich items for this kind and add to the final result structure
			resultForAllKinds[currentKind].items = libraryItemsGroupedByKind[
				currentKind
			]
				.map((libraryItem) => {
					const actualItem = actualItemsMap.get(
						libraryItem.item_id.toString(),
					)
					if (actualItem) {
						return {
							...actualItem,
							liked: true,
							liked_at: libraryItem.created_at,
							library_item_id: libraryItem._id,
						}
					}
					console.warn(
						`Actual item not found for kind ${currentKind} with ID ${libraryItem.item_id} in fetchAllKindsData`,
					)
					return null
				})
				.filter((item) => item !== null)
		},
	)

	// fetch total counts for all kinds for the user in parallel
	const totalCountsPromise = MusicLibraryItem.aggregate([
		{ $match: baseQuery },
		{ $group: { _id: "$kind", count: { $sum: 1 } } },
	]).exec()

	// wait for all detail fetches and the count aggregation
	await Promise.all([...detailFetchPromises, totalCountsPromise])

	// populate total_items from the resolved count aggregation
	const totalCountsResult = await totalCountsPromise

	totalCountsResult.forEach((countEntry) => {
		if (resultForAllKinds[countEntry._id]) {
			resultForAllKinds[countEntry._id].total_items = countEntry.count
		}
	})

	return resultForAllKinds
}

export default async ({ user_id, kind, limit = 100, offset = 0 } = {}) => {
	if (typeof kind === "string" && Library.kindToModel[kind]) {
		return await fetchSingleKindData(user_id, kind, limit, offset)
	} else {
		return await fetchAllKindsData(user_id, limit, offset)
	}
}
