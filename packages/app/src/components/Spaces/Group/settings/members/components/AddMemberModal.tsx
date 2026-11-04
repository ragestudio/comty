import React from "react"
import { Button, Empty, Input, Modal, Skeleton } from "antd"

import Image from "@components/Image"
import { Icons } from "@components/Icons"

import GroupsModel from "@endpoints/groups"
import SearchModel from "comty.js/endpoints/search"
import getErrorMessage from "@utils/getErrorMessage"

export type AddMemberModalProps = {
	open: boolean
	groupId?: string
	onClose: () => void
	onAdded: () => void
}

const AddMemberModal = ({
	open,
	groupId,
	onClose,
	onAdded,
}: AddMemberModalProps) => {
	const [query, setQuery] = React.useState("")
	const [users, setUsers] = React.useState<any[]>([])
	const [loading, setLoading] = React.useState(false)
	const [adding, setAdding] = React.useState<string | null>(null)

	React.useEffect(() => {
		if (!open || query.trim().length === 0) {
			setUsers([])
			return
		}

		const timeout = setTimeout(async () => {
			setLoading(true)

			try {
				const result = await SearchModel.search(query.trim())
				setUsers(Array.isArray(result?.users) ? result.users : [])
			} finally {
				setLoading(false)
			}
		}, 300)

		return () => clearTimeout(timeout)
	}, [open, query])

	const addUser = async (userId: string) => {
		if (!groupId) return

		setAdding(userId)

		try {
			await GroupsModel.members.add(groupId, userId)
			app.message.success("Member added")
			onAdded()
			onClose()
		} catch (error) {
			app.message.error(getErrorMessage(error, "Failed to add member"))
		} finally {
			setAdding(null)
		}
	}

	return (
		<Modal
			open={open}
			title="Add member"
			footer={null}
			onCancel={onClose}
		>
			<Input
				autoFocus
				placeholder="Search by username"
				prefix={<Icons.Search />}
				value={query}
				onChange={(event) => setQuery(event.target.value)}
			/>

			<div className="settings-members__add-results">
				{loading && <Skeleton active />}

				{!loading && query.trim().length > 0 && users.length === 0 && (
					<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
				)}

				{!loading &&
					users.map((user) => (
						<div
							key={user._id}
							className="settings-members__add-result"
						>
							<Image src={user.avatar} />

							<span>{user.username}</span>

							<Button
								type="primary"
								size="small"
								loading={adding === user._id}
								onClick={() => addUser(user._id)}
							>
								Add
							</Button>
						</div>
					))}
			</div>
		</Modal>
	)
}

export default AddMemberModal
