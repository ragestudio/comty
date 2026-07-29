import type { Members, Member } from "../../collections/member"

import React from "react"
import GroupsModel from "@models/groups"
import { cacheMembers, cacheTotalMembers } from "../../helpers/cache"

export const useGroupMembers = (
	group_id: string,
	evaluateMembersConnections: (members: Member[]) => Promise<void>,
	evaluateMembersDecorations: (members: Member[]) => Promise<void>,
) => {
	const [members, setMembers] = React.useState<Members>(null as any)
	const lastLoadedMemberId = React.useRef<string | null>(null)

	const fetchMembers = React.useCallback(async () => {
		try {
			const res = await GroupsModel.members.list(group_id, {
				offset: lastLoadedMemberId.current,
			})

			if (res.items.length > 0) {
				lastLoadedMemberId.current = res.items[0]._id
			}

			setMembers((prev: Members) => {
				const existingIds = new Set(
					(prev?.items || []).map((m: Member) => m._id),
				)

				const newItems = res.items.filter(
					(item: Member) => !existingIds.has(item._id),
				)

				const mergedItems = [...(prev?.items || []), ...newItems]

				return {
					items: mergedItems,
					total_items: res.total_items,
					has_more: mergedItems.length < res.total_items,
				}
			})

			await cacheMembers(group_id, res)
			await cacheTotalMembers(group_id, res.total_items)

			evaluateMembersConnections(res.items)
			evaluateMembersDecorations(res.items)

			return res
		} catch (err) {
			console.error("Error fetching more members:", err)
		}
	}, [group_id, evaluateMembersConnections, evaluateMembersDecorations])

	return { members, setMembers, fetchMembers, lastLoadedMemberId }
}
