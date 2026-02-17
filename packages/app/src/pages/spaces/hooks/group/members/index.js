import React from "react"

import GroupsModel from "@models/groups"

const useMembers = ({ groupId }) => {
	if (!groupId) {
		throw new Error("group_id is required")
	}

	const [members, setMembers] = React.useState([])
	const [hasMore, setHasMore] = React.useState(true)
	const [totalMembers, setTotalMembers] = React.useState(0)

	const lastId = React.useRef(null)

	const fetchMembers = React.useCallback(async () => {
		const result = await GroupsModel.members.list(groupId, {
			offset: lastId.current,
		})

		if (result.items.length > 0) {
			lastId.current = result.items[0]._id
			setMembers((prev) => [...prev, ...result.items])
		}

		setTotalMembers(result.total_items)
		setHasMore(result.has_more)
	}, [groupId, lastId])

	return {
		members,
		totalMembers,
		hasMore,
		fetchMembers,
	}
}

export default useMembers
