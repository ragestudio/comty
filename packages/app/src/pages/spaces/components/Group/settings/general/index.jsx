import React from "react"
import { Input } from "antd"
import Button from "@ui/Button"
import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"

import GroupContext from "@pages/spaces/contexts/group"
import GroupsModel from "@models/groups"

const GeneralSettings = () => {
	const group = React.useContext(GroupContext)

	const baseValues = React.useMemo(() => {
		return {
			name: group.name,
			description: group.description,
			icon: group.icon,
			cover: group.cover,
		}
	}, [])

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
		await GroupsModel.modify(group._id, values)
	}

	return (
		<div className="group-settings-panel__fields">
			<div className="group-settings-panel__fields__field">
				<Input value={values.icon} />

				<UploadButton
					onSuccess={(uid, response) => {
						updateSetting("icon", response.url)
					}}
				/>
			</div>

			<div className="group-settings-panel__fields__field">
				<Input value={values.cover} />

				<UploadButton
					onSuccess={(uid, response) => {
						updateSetting("cover", response.url)
					}}
				/>
			</div>

			<div className="group-settings-panel__fields__field">
				<Input
					placeholder="Group Name"
					defaultValue={values.name}
					onChange={(e) => {
						updateSetting("name", e.target.value)
					}}
				/>
			</div>

			<div className="group-settings-panel__fields__field">
				<Input
					placeholder="Group Description"
					defaultValue={values.description}
					onChange={(e) => {
						updateSetting("description", e.target.value)
					}}
				/>
			</div>
		</div>
	)

	return (
		<div className="group-settings-panel__fields">
			<div className="group-settings-panel__field">
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
