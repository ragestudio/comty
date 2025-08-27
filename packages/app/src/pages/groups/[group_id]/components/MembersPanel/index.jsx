import React from "react"
import classnames from "classnames"

import LoadMore from "@components/LoadMore"
import UserPreview from "@components/UserPreview"

import GroupsModel from "@models/groups"

import GroupPageContext from "../../context"

import "./index.less"

const Member = ({ user, connected }) => {
	return (
		<div
			className={classnames("group-page__members-panel__member", {
				["connected"]: !!connected,
			})}
		>
			<div className="group-page__members-panel__member__connection" />

			<div className="group-page__members-panel__member__content">
				<UserPreview
					user={
						user ?? {
							public_name: "Deleted account",
							username: "unknown",
						}
					}
					small
				/>
			</div>
		</div>
	)
}

const MembersPanel = () => {
	const ctx = React.useContext(GroupPageContext)

	const [totalMembers, setTotalMembers] = React.useState(0)
	const [members, setMembers] = React.useState([])
	const [hasMore, setHasMore] = React.useState(true)

	const lastId = React.useRef(null)

	const fetchMembers = async () => {
		const result = await GroupsModel.members.list(ctx.group._id, {
			offset: lastId.current,
		})

		if (result.items.length > 0) {
			lastId.current = result.items[0]._id
			setMembers((prev) => [...prev, ...result.items])
		}

		setTotalMembers(result.total_items)
		setHasMore(result.has_more)
	}

	React.useEffect(() => {
		// sort member by connection status
		setMembers((prev) => {
			return prev.sort((a, b) => {
				if (ctx.group.connected_members.includes(a._id)) {
					return -1
				}

				if (ctx.group.connected_members.includes(b._id)) {
					return 1
				}

				return 0
			})
		})
	}, [ctx.group, members])

	return (
		<div className="group-page__members-panel">
			<div className="group-page__members-panel__header">
				<h3>Members [{totalMembers}]</h3>
			</div>

			<LoadMore
				hasMore={hasMore}
				onBottom={fetchMembers}
				className="group-page__members-panel__list"
			>
				{members.map((member) => (
					<Member
						key={member._id}
						user={member.user}
						connected={ctx.group.connected_members.includes(
							member.user_id,
						)}
					/>
				))}
			</LoadMore>
		</div>
	)
}

export default MembersPanel
