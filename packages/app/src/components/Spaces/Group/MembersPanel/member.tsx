import type { Member as T_Member } from "@comty/shared/types/spaces/collections/member"

import React from "react"
import { Tag } from "antd"
import classNames from "classnames"

import { Icons } from "@components/Icons"
import UserPreview from "@components/UserPreview"
import copyToClipboard from "@utils/copyToClipboard"

import "./member.less"

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
		<div className="member__context-menu">
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
		</div>
	)
}

const MemberBackgroundDecoration = ({
	decoration,
	playing,
}: {
	decoration: any
	playing?: boolean
}) => {
	const mediaRef = React.useRef(null)
	const [mimetype, setMimetype] = React.useState(null)

	const getMimetype = async () => {
		try {
			const response = await fetch(decoration.image_obj, {
				method: "HEAD",
			})

			const contentType = response.headers.get("content-type")

			if (!contentType) {
				return null
			}

			setMimetype(contentType.split("/"))
		} catch (error) {
			console.error(error)
		}
	}

	React.useEffect(() => {
		if (!mediaRef.current) return undefined

		if (playing) {
			mediaRef.current.play()
		} else {
			mediaRef.current.pause()
		}
	}, [playing])

	React.useEffect(() => {
		if (!decoration?.image_obj) return undefined

		getMimetype()
	}, [decoration])

	if (!decoration) return null
	if (!mimetype) return null

	return (
		<div
			className={classNames(
				"group-page__members-panel__member__bg-decoration",
				{
					playing: playing,
				},
			)}
		>
			{mimetype[0] === "video" && (
				<video
					src={decoration.image_obj}
					ref={mediaRef}
					playsInline
					loop
					muted
				/>
			)}

			{mimetype[0] === "image" && <img src={decoration.image_obj} />}
		</div>
	)
}

export const Member = ({
	member,
	connected,
	decorations,
}: {
	member: T_Member
	connected: boolean
	decorations?: Record<string, any>
}) => {
	if (!member || !member.user) return null
	const [hovering, setHovering] = React.useState(false)

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
			className={classNames("group-page__members-panel__member", {
				["connected"]: !!connected,
				["hovering"]: hovering,
			})}
			onClick={onContextMenuClick}
			onMouseEnter={() => setHovering(true)}
			onMouseLeave={() => setHovering(false)}
		>
			{decorations?.member_bg && (
				<MemberBackgroundDecoration
					decoration={decorations.member_bg}
					playing={hovering}
				/>
			)}
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
					onClick={() => {}}
				/>
			</div>
		</div>
	)
}

export const MemberMemo = React.memo(Member, (prevProps, nextProps) => {
	return (
		prevProps.member._id === nextProps.member._id &&
		prevProps.connected === nextProps.connected &&
		prevProps.decorations === nextProps.decorations
	)
})

export default MemberMemo
