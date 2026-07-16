import React from "react"
import { Skeleton } from "antd"
import { Icons } from "@components/Icons"
import LoadMore from "@components/LoadMore"

import GroupContext from "@contexts/WithSpaces/group"

import Member from "./member"

import "./index.less"

const MembersPanel = () => {
	const group = React.useContext(GroupContext)

	const { online, offline } = React.useMemo(() => {
		const list = group?.members?.items || []
		const connectedIds = group?.connectedMembers || []

		const onlineList = []
		const offlineList = []

		const getDisplayName = (m) => {
			return m?.user?.public_name || m?.user?.username || "zzzz"
		}

		const sortedList = [...list].sort((a, b) => {
			return getDisplayName(a).localeCompare(
				getDisplayName(b),
				undefined,
				{ sensitivity: "base" },
			)
		})

		for (const member of sortedList) {
			if (connectedIds.includes(member.user_id)) {
				onlineList.push(member)
			} else {
				offlineList.push(member)
			}
		}

		return { online: onlineList, offline: offlineList }
	}, [group.loading, group])

	return (
		<div className="group-page__members-panel">
			<div className="group-page__members-panel__header">
				<h3>
					<Icons.UsersRound /> Members
				</h3>
				<span className="group-page__members-panel__header__members-count">
					{group?.members?.total_items ?? 0}
				</span>
			</div>

			{(group?.loading || !group?.members?.items) && <Skeleton />}

			{!group?.loading && group?.members?.items && (
				<LoadMore
					hasMore={group?.members?.has_more}
					loading={group.loading}
					onBottom={group?.fetchMembers}
					className="group-page__members-panel__list"
				>
					{online.length > 0 && (
						<p className="status-label">Online</p>
					)}
					{online.map((member) => (
						<Member
							key={`online-${member._id}`}
							member={member}
							connected={true}
						/>
					))}

					{offline.length > 0 && (
						<p className="status-label">Offline</p>
					)}
					{offline.map((member) => (
						<Member
							key={`offline-${member._id}`}
							member={member}
							connected={false}
						/>
					))}
				</LoadMore>
			)}
		</div>
	)
}

export default MembersPanel
