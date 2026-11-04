import type { Member } from "@comty/shared/types/spaces/member"

import React from "react"
import { Input, Modal } from "antd"

import GroupsModel from "@endpoints/groups"
import getErrorMessage from "@utils/getErrorMessage"

export type BanMemberModalProps = {
	member: Member | null
	groupId?: string
	onClose: () => void
	onBanned: () => void
}

const BanMemberModal = ({
	member,
	groupId,
	onClose,
	onBanned,
}: BanMemberModalProps) => {
	const [reason, setReason] = React.useState("")
	const [loading, setLoading] = React.useState(false)

	React.useEffect(() => {
		setReason("")
	}, [member])

	const submit = async () => {
		if (!member || !groupId) return

		setLoading(true)

		try {
			await GroupsModel.members.ban(groupId, member._id, {
				reason: reason.trim() || undefined,
			})

			app.message.success("Member banned")
			onBanned()
			onClose()
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to ban member"))
		} finally {
			setLoading(false)
		}
	}

	return (
		<Modal
			open={Boolean(member)}
			title="Ban member"
			okText="Ban"
			okButtonProps={{ danger: true, loading }}
			onOk={submit}
			onCancel={onClose}
		>
			<p>Ban and remove @{member?.user?.username ?? member?.user_id}</p>

			<Input.TextArea
				placeholder="Reason (optional)"
				value={reason}
				maxLength={300}
				rows={3}
				onChange={(event) => setReason(event.target.value)}
			/>
		</Modal>
	)
}

export default BanMemberModal
