import React from "react"

import LoadMore from "@components/LoadMore"
import UserPreview from "@components/UserPreview"

import GroupsModel from "@models/groups"

import GroupContext from "../../context"

import "./index.less"

const MembersPanel = () => {
	const group = React.useContext(GroupContext)

	const [totalMembers, setTotalMembers] = React.useState(0)
	const [members, setMembers] = React.useState([])
	const [hasMore, setHasMore] = React.useState(true)

	const page = React.useRef(0)

	const fetchMembers = async () => {
		const result = await GroupsModel.members.get(group._id, {
			page: page.current,
		})

		setMembers((prev) => [...prev, ...result.items])
		setTotalMembers(result.total_items)
		setHasMore(result.has_more)
	}

	const onLoadMore = async () => {
		page.current += 1
		await fetchMembers()
	}

	React.useEffect(() => {
		fetchMembers()
	}, [])

	return (
		<div className="group-page__members-panel">
			<div className="group-page__members-panel__header">
				<h3>Members [{totalMembers}]</h3>
			</div>

			<LoadMore
				hasMore={hasMore}
				onBottom={onLoadMore}
				className="group-page__members-panel__list"
			>
				{members.map((member) => (
					<UserPreview
						key={member._id}
						user={member}
						small
					/>
				))}
			</LoadMore>
		</div>
	)
}

export default MembersPanel
