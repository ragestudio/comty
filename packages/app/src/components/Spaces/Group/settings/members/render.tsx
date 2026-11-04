import type { Member } from "@comty/shared/types/spaces/member"
import type { GroupRole } from "@comty/shared/types/spaces/role"

import React from "react"
import { Button, Empty, Flex, Input, Listy, Select, Skeleton } from "antd"

import { Icons } from "@components/Icons"
import { useGroupActions, useGroupData } from "@comty/spaces-sdk/group"
import { useUsers } from "@comty/spaces-sdk/users"

import GroupsModel from "@endpoints/groups"

import AddMemberModal from "./components/AddMemberModal"
import BanMemberModal from "./components/BanMemberModal"
import MemberRow from "./components/MemberRow"
import TransferOwnershipModal from "./components/TransferOwnershipModal"
import { useMembersList } from "./useMembersList"

import "./index.less"

const MembersSettings = () => {
	const data = useGroupData()
	const actions = useGroupActions()

	const groupId = data?._id
	const permissions = data?.viewer_permissions

	const isOwner =
		data?.is_owner === true ||
		(Boolean(data?.owner_user_id) && data?.owner_user_id === app.userData?._id)

	const canManageRoles = isOwner || permissions?.MANAGE_ROLES === true
	const canKick = isOwner || permissions?.KICK_MEMBERS === true
	const canBan = isOwner || permissions?.BAN_MEMBERS === true
	const canAddMembers = isOwner || permissions?.MANAGE_MEMBERSHIPS === true
	const canTransferOwnership = isOwner

	const [roles, setRoles] = React.useState<GroupRole[]>([])
	const [search, setSearch] = React.useState("")
	const [roleFilter, setRoleFilter] = React.useState<string | null>(null)

	const [addOpen, setAddOpen] = React.useState(false)
	const [banTarget, setBanTarget] = React.useState<Member | null>(null)
	const [transferTarget, setTransferTarget] = React.useState<Member | null>(
		null,
	)

	const { items, total, hasMore, loading, loadingMore, refresh, loadMore } =
		useMembersList(groupId, search)

	const userIds = React.useMemo(
		() => items.map((member) => member.user_id),
		[items],
	)

	const users = useUsers(userIds)

	const displayItems = React.useMemo(
		() =>
			items.map((member) => ({
				...member,
				user: users[member.user_id]
					? { ...member.user, ...users[member.user_id] }
					: member.user,
			})),
		[items, users],
	)

	const filteredItems = React.useMemo(() => {
		if (!roleFilter) return displayItems

		return displayItems.filter((member) =>
			member.roles.some((role) => role._id === roleFilter),
		)
	}, [displayItems, roleFilter])

	const roleOptions = React.useMemo(() => {
		const options = roles
			.filter((role) => !role.is_default)
			.map((role) => ({
				value: role.role_key,
				label: role.label,
			}))

		options.unshift({ value: "owner", label: "Owner" })
		options.push({ value: "member", label: "Member" })

		return options
	}, [roles])

	React.useEffect(() => {
		if (!groupId) return

		GroupsModel.roles
			.list(groupId)
			.then((response) => setRoles(response.items ?? []))
			.catch((error) => console.error("Failed to load roles", error))
	}, [groupId])

	const onRefresh = React.useCallback(() => {
		refresh()
		actions.fetchMembers()
	}, [refresh, actions])

	const onTransferred = React.useCallback(() => {
		actions.fetchGroup()
		onRefresh()
	}, [actions, onRefresh])

	const renderItem = React.useCallback(
		(member: Member) => (
			<MemberRow
				member={member}
				groupId={groupId}
				selfUserId={app.userData?._id}
				ownerUserId={data?.owner_user_id}
				roles={roles}
				canManageRoles={canManageRoles}
				canKick={canKick}
				canBan={canBan}
				canTransferOwnership={canTransferOwnership}
				onRefresh={onRefresh}
				onBan={setBanTarget}
				onTransfer={setTransferTarget}
			/>
		),
		[
			groupId,
			data?.owner_user_id,
			roles,
			canManageRoles,
			canKick,
			canBan,
			canTransferOwnership,
			onRefresh,
		],
	)

	return (
		<div className="settings-members">
			<div className="settings-members__toolbar">
				<Input
					placeholder="Search members"
					prefix={<Icons.Search />}
					allowClear
					style={{ flex: 1 }}
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>

				<Select
					allowClear
					placeholder="All roles"
					value={roleFilter ?? undefined}
					options={roleOptions}
					onChange={(value) => setRoleFilter(value ?? null)}
					style={{ minWidth: 150 }}
				/>

				{canAddMembers && (
					<Button
						icon={<Icons.UserPlus />}
						onClick={() => setAddOpen(true)}
					>
						Add member
					</Button>
				)}
			</div>

			<div className="settings-members__list">
				{loading && <Skeleton active />}

				{!loading && filteredItems.length === 0 && (
					<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
				)}

				{!loading && filteredItems.length > 0 && (
					<Listy<Member>
						virtual
						rowKey="_id"
						items={filteredItems}
						itemRender={renderItem}
					/>
				)}
			</div>

			<Flex
				justify="center"
				align="center"
				gap={10}
			>
				<p>
					{filteredItems.length}/{total} members
				</p>

				{hasMore && (
					<Button
						size="small"
						loading={loadingMore}
						onClick={loadMore}
					>
						Load more
					</Button>
				)}
			</Flex>

			<AddMemberModal
				open={addOpen}
				groupId={groupId}
				onClose={() => setAddOpen(false)}
				onAdded={onRefresh}
			/>

			<BanMemberModal
				member={banTarget}
				groupId={groupId}
				onClose={() => setBanTarget(null)}
				onBanned={onRefresh}
			/>

			<TransferOwnershipModal
				member={transferTarget}
				groupId={groupId}
				groupName={data?.name}
				onClose={() => setTransferTarget(null)}
				onTransferred={onTransferred}
			/>
		</div>
	)
}

export default MembersSettings
