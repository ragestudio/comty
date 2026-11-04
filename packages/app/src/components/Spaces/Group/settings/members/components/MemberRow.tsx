import type { Member } from "@comty/shared/types/spaces/member"
import type { GroupRole } from "@comty/shared/types/spaces/role"

import React from "react"
import { Button, Popconfirm, Tag } from "antd"

import Image from "@components/Image"
import { Icons } from "@components/Icons"

import GroupsModel from "@endpoints/groups"
import getErrorMessage from "@utils/getErrorMessage"

import RoleSelect from "./RoleSelect"

export type MemberRowProps = {
	member: Member
	groupId?: string
	selfUserId?: string
	ownerUserId?: string
	roles: GroupRole[]
	canManageRoles: boolean
	canKick: boolean
	canBan: boolean
	canTransferOwnership: boolean
	onRefresh: () => void
	onBan: (member: Member) => void
	onTransfer: (member: Member) => void
}

const MemberRow = ({
	member,
	groupId,
	selfUserId,
	ownerUserId,
	roles,
	canManageRoles,
	canKick,
	canBan,
	canTransferOwnership,
	onRefresh,
	onBan,
	onTransfer,
}: MemberRowProps) => {
	const isOwnerMember = member.user_id === ownerUserId
	const isSelf = member.user_id === selfUserId

	const joinedAt = member.created_at
		? new Date(member.created_at).toLocaleDateString()
		: null

	const onKick = async () => {
		if (!groupId) return

		try {
			await GroupsModel.members.remove(groupId, member._id)

			onRefresh()
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to kick member"))
		}
	}

	return (
		<div className="settings-members__list__item">
			<div className="settings-members__list__item__avatar">
				<Image src={member.user?.avatar} />
			</div>

			<div className="settings-members__list__item__info">
				<p>{member.user?.username ?? member.user_id}</p>
				{joinedAt && (
					<span className="settings-members__joined">Joined {joinedAt}</span>
				)}
			</div>

			<Tag>
				{member.roles.map((role) => (
					<span key={role._id}>{role.label}</span>
				))}
			</Tag>

			<RoleSelect
				member={member}
				groupId={groupId}
				roles={roles}
				canManageRoles={canManageRoles}
				isOwner={canTransferOwnership}
				onRefresh={onRefresh}
			/>

			<div className="settings-members__actions">
				{canTransferOwnership && !isOwnerMember && !isSelf && (
					<Button
						size="small"
						icon={<Icons.Crown />}
						title="Transfer ownership"
						onClick={() => onTransfer(member)}
					/>
				)}

				{canBan && !isOwnerMember && !isSelf && (
					<Button
						size="small"
						danger
						icon={<Icons.Ban />}
						title="Ban member"
						onClick={() => onBan(member)}
					/>
				)}

				{canKick && !isOwnerMember && !isSelf && (
					<Popconfirm
						title="Remove this member?"
						okText="Kick"
						onConfirm={onKick}
					>
						<Button
							size="small"
							danger
							icon={<Icons.UserMinus />}
							title="Kick member"
						/>
					</Popconfirm>
				)}
			</div>
		</div>
	)
}

export default MemberRow
