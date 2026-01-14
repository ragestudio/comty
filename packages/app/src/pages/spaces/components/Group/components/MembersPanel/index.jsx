import React from "react"
import { Tag } from "antd"
import classnames from "classnames"
import { Icons } from "@components/Icons"
import LoadMore from "@components/LoadMore"
import UserPreview from "@components/UserPreview"

import GroupsModel from "@models/groups"

import GroupContext from "@pages/spaces/contexts/group"
import copyToClipboard from "@utils/copyToClipboard"

import "./index.less"

const MemberContextMenu = ({ member, close }) => {
	const onClickUser = () => {
		app.navigation.goToAccount(member.user.username)
		close()
	}

	const onClickDirectMessage = () => {
		app.navigation.goToDirectMessage(member.user._id)
		close()
	}

	const onClickCopyUserId = () => {
		copyToClipboard(member.user._id)
		close()
	}

	const onClickKick = () => {
		console.log("onClickKick()", member)
		close()
	}

	const onClickBan = () => {
		console.log("onClickBan()", member)
		close()
	}

	return (
		<>
			<UserPreview
				user={member.user}
				onClick={onClickUser}
			/>

			<div className="context-menu-separator" />

			<div className="member-context-menu__roles">
				{member.roles.map((role) => {
					return (
						<Tag
							size="small"
							bordered={false}
						>
							{role.label}
						</Tag>
					)
				})}
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

const Member = ({ member, connected }) => {
	if (!member || !member.user) {
		return null
	}

	const onContextMenuClick = React.useCallback(
		(event) => {
			event.preventDefault()
			event.stopPropagation()

			console.log("onContextMenu()", member)

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
}

const MembersPanel = () => {
	const group = React.useContext(GroupContext)

	const [totalMembers, setTotalMembers] = React.useState(0)
	const [members, setMembers] = React.useState([])
	const [hasMore, setHasMore] = React.useState(true)

	const lastId = React.useRef(null)

	const fetchMembers = async () => {
		const result = await GroupsModel.members.list(group._id, {
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
				if (group.connected_members.includes(a._id)) {
					return -1
				}

				if (group.connected_members.includes(b._id)) {
					return 1
				}

				return 0
			})
		})
	}, [group, members])

	return (
		<div className="group-page__members-panel">
			<div className="group-page__members-panel__header">
				<h3>
					<Icons.UsersRound /> Members
				</h3>

				<span className="group-page__members-panel__header__members-count">
					{totalMembers}
				</span>
			</div>

			<LoadMore
				hasMore={hasMore}
				onBottom={fetchMembers}
				className="group-page__members-panel__list"
			>
				{members.map((member) => (
					<Member
						key={member._id}
						member={member}
						connected={group.connected_members.includes(
							member.user_id,
						)}
					/>
				))}
			</LoadMore>
		</div>
	)
}

export default MembersPanel
