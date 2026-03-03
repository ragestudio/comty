import React from "react"
import { Skeleton, Tag } from "antd"
import classnames from "classnames"
import { Icons } from "@components/Icons"
import LoadMore from "@components/LoadMore"
import UserPreview from "@components/UserPreview"

import GroupContext from "@contexts/WithSpaces/group"
import copyToClipboard from "@utils/copyToClipboard"

import "./index.less"

const MemberContextMenu = ({ member, close }) => {
	const onClickUser = React.useCallback(() => {
		app.navigation.goToAccount(member.user.username)
		close()
	}, [member, close])

	const onClickDirectMessage = React.useCallback(() => {
		app.navigation.goToDirectMessage(member.user._id)
		close()
	}, [member, close])

	const onClickCopyUserId = React.useCallback(() => {
		copyToClipboard(member.user._id)
		close()
	}, [member, close])

	const onClickKick = React.useCallback(() => {
		console.log("onClickKick()", member)
		close()
	}, [member, close])

	const onClickBan = React.useCallback(() => {
		console.log("onClickBan()", member)
		close()
	}, [member, close])

	return (
		<>
			<UserPreview
				user={member.user}
				onClick={onClickUser}
			/>

			<div className="context-menu-separator" />

			<div className="member-context-menu__roles">
				{member.roles?.map((role, index) => (
					<Tag
						key={role._id || index}
						size="small"
						variant={"filled"}
					>
						{role.label}
					</Tag>
				))}
			</div>

			<div className="context-menu-separator" />

			<div
				className="item"
				onClick={onClickDirectMessage}
			>
				<div className="item__line">
					<p className="item__line__label">Direct Message</p>
					<div className="item__line__icon">
						<Icons.MessageCircle />
					</div>
				</div>
			</div>

			<div
				className="item"
				onClick={onClickCopyUserId}
			>
				<div className="item__line">
					<p className="item__line__label">Copy User ID</p>
					<div className="item__line__icon">
						<Icons.Copy />
					</div>
				</div>
			</div>

			<div className="context-menu-separator" />

			<div
				className="item danger"
				onClick={onClickKick}
			>
				<div className="item__line">
					<p className="item__line__label">Kick</p>
					<div className="item__line__icon">
						<Icons.CircleMinus />
					</div>
				</div>
			</div>

			<div
				className="item danger"
				onClick={onClickBan}
			>
				<div className="item__line">
					<p className="item__line__label">Ban</p>
					<div className="item__line__icon">
						<Icons.CircleSlash />
					</div>
				</div>
			</div>
		</>
	)
}

const Member = React.memo(
	({ member, connected }) => {
		if (!member || !member.user) return null

		const onContextMenuClick = React.useCallback(
			(event) => {
				event.preventDefault()
				event.stopPropagation()

				const { x, y } = app.cores.ctx_menu.calculateFitCordinates(
					event,
					parseInt(
						app.cores.style.vars["context-menu-width"].replace(
							"px",
							"",
						),
					),
					100,
				)

				app.cores.ctx_menu.renderMenu(
					React.createElement(MemberContextMenu, {
						member: member,
						close: app.cores.ctx_menu.close,
					}),
					x,
					y,
				)
			},
			[member],
		)

		return (
			<div
				context-menu="ignore"
				data-membership-id={member._id}
				data-user-id={member.user._id}
				className={classnames("group-page__members-panel__member", {
					["connected"]: !!connected,
				})}
				onContextMenu={onContextMenuClick}
			>
				<div className="group-page__members-panel__member__connection" />
				<div className="group-page__members-panel__member__content">
					<UserPreview
						user={
							member.user ?? {
								public_name: "Deleted account",
								username: "unknown",
							}
						}
						small
					/>
				</div>
			</div>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.member._id === nextProps.member._id &&
			prevProps.connected === nextProps.connected
		)
	},
)

const MembersPanel = () => {
	const group = React.useContext(GroupContext)

	const { online, offline } = React.useMemo(() => {
		const list = group?.members?.list || []
		const connectedIds = group?.connectedMembers || []

		const connectedSet = new Set(connectedIds)

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
			if (connectedSet.has(member.user_id)) {
				onlineList.push(member)
			} else {
				offlineList.push(member)
			}
		}

		return { online: onlineList, offline: offlineList }
	}, [group?.members?.list, group?.connectedMembers])

	return (
		<div className="group-page__members-panel">
			<div className="group-page__members-panel__header">
				<h3>
					<Icons.UsersRound /> Members
				</h3>
				<span className="group-page__members-panel__header__members-count">
					{group?.members?.total ?? 0}
				</span>
			</div>

			{(group?.loading || !group?.members?.list) && <Skeleton />}

			{!group?.loading && group?.members?.list && (
				<LoadMore
					hasMore={group?.members?.hasMore}
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
