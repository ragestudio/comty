import React from "react"
import Button from "@ui/Button"
import ConfirmButton from "@ui/ConfirmButton"
import Popover from "@ui/Popover"

import { Icons } from "@components/Icons"

import GroupsModel from "@models/groups"
import GroupContext from "@pages/spaces/contexts/group"

import use from "comty.js/hooks/use"
import copyToClipboard from "@utils/copyToClipboard"

import "./index.less"

const PopoverConfirmComponent = ({ title, description, onConfirm }) => {
	return (
		<div>
			{title && <h3>{title}</h3>}
			{description && <p>{description}</p>}

			<Button
				size="small"
				onClick={onConfirm}
			/>
		</div>
	)
}

const GroupInviteItem = ({ invite, onClickDelete, onClickCopy }) => {
	return (
		<div className="group-invites__list__item">
			<div className="group-invites__list__item__header">
				<Button
					icon={<Icons.Link />}
					size="small"
					onClick={onClickCopy}
				/>

				<p>{invite.key}</p>
			</div>

			<div className="group-invites__list__item__info">
				<p>
					<Icons.Clock /> Expires at {invite.expires_at ?? "Never"}
				</p>

				<p>
					<Icons.CircleUserRound />
					{String(invite.usages ?? 0)} /{" "}
					{String(invite.max_usage ?? "∞")}
				</p>

				<ConfirmButton
					icon={<Icons.Trash />}
					onConfirm={onClickDelete}
				/>
			</div>
		</div>
	)
}

const GroupInvitesSettings = () => {
	const group = React.useContext(GroupContext)

	const { loading, error, result, repeat } = use(
		GroupsModel.invites.getAll,
		group._id,
	)

	const onClickCopyItem = React.useCallback(
		(item) => {
			copyToClipboard(
				`${window.location.origin}/invite/${group._id}/${item.key}`,
			)
		},
		[result],
	)

	const onClickDeleteItem = React.useCallback(
		async (item) => {
			await GroupsModel.invites.delete(group._id, item.key)
			await repeat()
		},
		[result],
	)

	const onClickCreateNewItem = React.useCallback(async () => {
		await GroupsModel.invites.create(group._id)
		await repeat()
	}, [result])

	if (error) {
		return <div>Error {String(error.message)}</div>
	}

	if (loading) {
		return <div>Loading...</div>
	}

	return (
		<div className="group-invites__list">
			<div className="group-invites__list__item">
				<Button
					size="small"
					icon={<Icons.Plus />}
					onClick={onClickCreateNewItem}
				>
					Create new
				</Button>
			</div>

			{result.map((item, index) => {
				return (
					<GroupInviteItem
						key={index}
						invite={item}
						onClickCopy={() => onClickCopyItem(item)}
						onClickDelete={() => onClickDeleteItem(item)}
					/>
				)
			})}
		</div>
	)
}

export default {
	key: "invites",
	label: "Invites",
	icon: Icons.Link,
	render: GroupInvitesSettings,
}
