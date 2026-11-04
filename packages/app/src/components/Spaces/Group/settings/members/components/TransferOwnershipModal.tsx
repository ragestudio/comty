import type { Member } from "@comty/shared/types/spaces/member"

import React from "react"
import { Input, Modal } from "antd"

import GroupsModel from "@endpoints/groups"
import getErrorMessage from "@utils/getErrorMessage"

export type TransferOwnershipModalProps = {
	member: Member | null
	groupId?: string
	groupName?: string
	onClose: () => void
	onTransferred: () => void
}

const TransferOwnershipModal = ({
	member,
	groupId,
	groupName,
	onClose,
	onTransferred,
}: TransferOwnershipModalProps) => {
	const [confirmation, setConfirmation] = React.useState("")
	const [loading, setLoading] = React.useState(false)

	React.useEffect(() => {
		setConfirmation("")
	}, [member])

	const submit = async () => {
		if (!member || !groupId) return

		if (confirmation.trim() !== groupName) {
			app.message.error("Type the group name to confirm")
			return
		}

		setLoading(true)

		try {
			await GroupsModel.transferOwnership(groupId, member.user_id)

			app.message.success("Ownership transferred")
			onTransferred()
			onClose()
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to transfer ownership"))
		} finally {
			setLoading(false)
		}
	}

	return (
		<Modal
			open={Boolean(member)}
			title="Transfer ownership"
			okText="Transfer"
			okButtonProps={{
				danger: true,
				loading,
				disabled: confirmation.trim() !== groupName,
			}}
			onOk={submit}
			onCancel={onClose}
		>
			<p>
				Transfer the group to @{member?.user?.username ?? member?.user_id}. You
				will keep the admin role.
			</p>

			<p>
				Type <b>{groupName}</b> to confirm.
			</p>

			<Input
				value={confirmation}
				onChange={(event) => setConfirmation(event.target.value)}
			/>
		</Modal>
	)
}

export default TransferOwnershipModal
