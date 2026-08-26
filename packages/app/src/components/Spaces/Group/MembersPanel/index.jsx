import React from "react"
import { Skeleton } from "antd"
import { Icons } from "@components/Icons"
import LoadMore from "@components/LoadMore"

import {
	useGroupLoading,
	useGroupMembers,
	useGroupConnections,
	useGroupDecorations,
	useGroupActions,
} from "@comty/spaces-lib"

import Member from "./member"

import "./index.less"

const MembersPanel = () => {
	const loading = useGroupLoading()
	const members = useGroupMembers()
	const connectedMembers = useGroupConnections()
	const membersDecorations = useGroupDecorations()
	const actions = useGroupActions()

	const { online, offline } = React.useMemo(() => {
		const list = members?.items || []
		const connectedIds = connectedMembers || []

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
	}, [loading, members, connectedMembers])

	return (
		<div className="group-page__members-panel">
			<div className="group-page__members-panel__header">
				<h3>
					<Icons.UsersRound /> Members
				</h3>
				<span className="group-page__members-panel__header__members-count">
					{members?.total_items ?? 0}
				</span>
			</div>

			{(loading || !members?.items) && <Skeleton />}

			{!loading && members?.items && (
				<LoadMore
					hasMore={members?.has_more}
					loading={loading}
					onBottom={actions.fetchMembers}
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
							decorations={membersDecorations[member.user_id]}
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
							decorations={membersDecorations[member.user_id]}
						/>
					))}
				</LoadMore>
			)}
		</div>
	)
}

export default MembersPanel
