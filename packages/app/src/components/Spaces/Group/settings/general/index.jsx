import React from "react"
import { Input } from "antd"

import Button from "@ui/Button"
import ConfirmButton from "@ui/ConfirmButton"
import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"

import { useGroupData } from "@contexts/WithSpaces/stores"
import GroupsModel from "@models/groups"

import "./index.less"

const GeneralSettings = () => {
	const data = useGroupData()

	const baseValues = React.useMemo(() => {
		return {
			name: data?.name,
			description: data?.description,
			icon: data?.icon,
			cover: data?.cover,
		}
	}, [data])

	const [values, setValues] = React.useState(baseValues)

	const updateSetting = (key, value) => {
		setValues((prev) => ({
			...prev,
			[key]: value,
		}))
	}

	const hasChanges = () => {
		return Object.keys(values).some((key) => {
			return values[key] !== baseValues[key]
		})
	}

	const submit = async () => {
		console.log("submit", values)
		await GroupsModel.modify(data?._id, values)
		baseValues
	}

	const handleDeleteGroup = async () => {
		app.layout.modal.confirm({
			onConfirm: async () => {
				await GroupsModel.delete(data?._id)

				app.cores.notifications.new({
					title: "Group deleted",
					description: "This group has been deleted permanently",
				})

				app.location.push("/spaces")
			},
		})
	}

	const handleLeaveGroup = async () => {
		app.layout.modal.confirm({
			onConfirm: async () => {
				await GroupsModel.leave(data?._id)

				app.location.push("/spaces")
			},
		})
	}

	return (
		<div className="group-settings-panel__fields">
			<div className="group-settings-panel__fields__field">
				<div className="group-settings-panel__fields__field__label">
					<span>Name</span>
				</div>

				<div className="group-settings-panel__fields__field__content">
					<Input
						placeholder="Group Name"
						defaultValue={values.name}
						onChange={(e) => {
							updateSetting("name", e.target.value)
						}}
					/>
				</div>
			</div>

			<div className="group-settings-panel__fields__field">
				<div className="group-settings-panel__fields__field__label">
					<span>Description</span>
				</div>

				<div className="group-settings-panel__fields__field__content">
					<Input
						placeholder="Group Description"
						defaultValue={values.description}
						onChange={(e) => {
							updateSetting("description", e.target.value)
						}}
					/>
				</div>
			</div>

			<div className="group-settings-panel__fields__field">
				<div className="group-settings-panel__fields__field__label">
					<span>Images</span>
				</div>

				<div className="group-settings-panel__fields__field__content">
					<UploadButton
						onSuccess={(uid, response) => {
							updateSetting("icon", response.url)
						}}
					>
						<span>Change Icon</span>
					</UploadButton>

					<UploadButton
						onSuccess={(uid, response) => {
							updateSetting("cover", response.url)
						}}
					>
						<span>Change Banner</span>
					</UploadButton>
				</div>
			</div>

			<div className="group-settings-panel__fields__field">
				<div className="group-settings-panel__fields__field__label">
					<span>Delete group</span>
				</div>

				<div className="group-settings-panel__fields__field__content">
					<ConfirmButton
						type="danger"
						onConfirm={handleDeleteGroup}
					>
						Delete
					</ConfirmButton>
				</div>
			</div>

			<div className="group-settings-panel__fields__field">
				<div className="group-settings-panel__fields__field__label">
					<span>Leave group</span>
				</div>

				<div className="group-settings-panel__fields__field__content">
					<ConfirmButton
						type="danger"
						onConfirm={handleLeaveGroup}
					>
						Leave
					</ConfirmButton>
				</div>
			</div>

			<div className="group-settings-panel__fields__bottom">
				{hasChanges() ? "Pending changes" : null}
				<Button
					type="primary"
					disabled={!hasChanges()}
					onClick={submit}
				>
					Save
				</Button>
			</div>
		</div>
	)
}

export default {
	key: "general",
	label: "General",
	icon: Icons.Settings,
	render: GeneralSettings,
}
