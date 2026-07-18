import React from "react"
import { Tag } from "antd"
import classnames from "classnames"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"

import copyToClipboard from "@utils/copyToClipboard"

import "./member.less"
import type { Member as T_Member } from "@/contexts/WithSpaces/collections/member"

export const MemberContextMenu = ({ member, close }) => {
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

export const Member = ({
	member,
	connected,
}: {
	member: T_Member
	connected: boolean
}) => {
	if (!member || !member.user) return null

	const onContextMenuClick = React.useCallback(
		(event) => {
			event.preventDefault()
			event.stopPropagation()

			const { x, y } = app.cores.ctx_menu.calculateFitCordinates(
				event,
				parseInt(
					app.cores.style.vars["context-menu-width"].replace("px", ""),
					10,
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
}

export const MemberMemo = React.memo(Member, (prevProps, nextProps) => {
	return (
		prevProps.member._id === nextProps.member._id &&
		prevProps.connected === nextProps.connected
	)
})

export default MemberMemo
