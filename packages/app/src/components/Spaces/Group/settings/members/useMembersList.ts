import type { Member } from "@comty/shared/types/spaces/member"

import React from "react"

import GroupsModel from "@endpoints/groups"
import getErrorMessage from "@utils/getErrorMessage"

const PAGE_SIZE = 50

export const useMembersList = (groupId?: string, search = "") => {
	const [items, setItems] = React.useState<Member[]>([])
	const [total, setTotal] = React.useState(0)
	const [hasMore, setHasMore] = React.useState(false)
	const [loading, setLoading] = React.useState(true)
	const [loadingMore, setLoadingMore] = React.useState(false)

	const requestId = React.useRef(0)

	const fetchMembers = React.useCallback(
		async ({
			reset = false,
			offset = null,
			query = search,
		}: {
			reset?: boolean
			offset?: string | null
			query?: string
		} = {}) => {
			if (!groupId) return

			const currentRequest = ++requestId.current

			if (reset) {
				setLoading(true)
			} else {
				setLoadingMore(true)
			}

			try {
				const response = await GroupsModel.members.list(groupId, {
					limit: PAGE_SIZE,
					offset,
					search: query.trim() || null,
				})

				if (currentRequest !== requestId.current) return

				setItems((prev) => {
					const next = reset ? [] : [...prev]
					const seen = new Set(next.map((member) => member._id))

					for (const member of response.items ?? []) {
						if (!seen.has(member._id)) {
							next.push(member)
						}
					}

					return next
				})

				setTotal(response.total_items ?? response.items?.length ?? 0)
				setHasMore(response.has_more ?? false)
			} catch (error) {
				if (currentRequest === requestId.current) {
					app.message.error(getErrorMessage(error, "Failed to load members"))
				}
			} finally {
				if (currentRequest === requestId.current) {
					setLoading(false)
					setLoadingMore(false)
				}
			}
		},
		[groupId, search],
	)

	React.useEffect(() => {
		if (!groupId) return

		const timeout = setTimeout(
			() => fetchMembers({ reset: true, query: search }),
			search ? 300 : 0,
		)

		return () => clearTimeout(timeout)
	}, [groupId, search, fetchMembers])

	const refresh = React.useCallback(() => {
		fetchMembers({ reset: true })
	}, [fetchMembers])

	const loadMore = React.useCallback(() => {
		const last = items[items.length - 1]

		if (!last || loadingMore) return

		fetchMembers({ offset: last._id, query: search })
	}, [items, loadingMore, fetchMembers, search])

	return {
		items,
		total,
		hasMore,
		loading,
		loadingMore,
		refresh,
		loadMore,
	}
}
