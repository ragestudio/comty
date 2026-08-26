import type EvaluateActions from "./index"
import type { Member } from "@comty/shared/types/spaces/member"

import UsersModel from "@models/user"

export default async function (
	this: EvaluateActions,
	items: (Member | string)[],
): Promise<void> {
	const cache = this.state.decorationsCache

	const missingIds = new Set<string>()
	const knownDecorations: Record<string, any> = {}
	let hasKnown = false

	items.forEach((item) => {
		const id = typeof item === "string" ? item : item.user_id

		// if its a Member object and has decorations, update the cache
		if (
			typeof item !== "string" &&
			item.user?.decorations &&
			!cache.has(id)
		) {
			cache.set(id, item.user.decorations)
		}

		const cachedDecs = cache.get(id)

		if (cachedDecs) {
			knownDecorations[id] = cachedDecs
			hasKnown = true
		} else {
			missingIds.add(id)
		}
	})

	// apply known from cache immediately
	if (hasKnown) {
		this.setState((state) => ({
			membersDecorations: {
				...state.membersDecorations,
				...knownDecorations,
			},
		}))
	}

	if (missingIds.size === 0) return

	const missingIdsArr = Array.from(missingIds)
	missingIdsArr.forEach((id) => cache.set(id, {}))

	try {
		const users_ids = missingIdsArr.join(",")
		const fetchedData = await UsersModel.V2.decorations.get(users_ids)

		if (Array.isArray(fetchedData)) {
			const newDecorationsDict = fetchedData.reduce(
				(acc: Record<string, any>, curr: any) => {
					const decs = curr.decorations || {}
					cache.set(curr.user_id, decs)
					acc[curr.user_id] = decs
					return acc
				},
				{},
			)

			this.setState((state) => ({
				membersDecorations: {
					...state.membersDecorations,
					...newDecorationsDict,
				},
			}))
		}
	} catch (err) {
		console.error("[decorations] Failed to fetch decorations", err)
		missingIds.forEach((id) => cache.delete(id)) // rollback
	}
}
