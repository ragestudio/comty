import React from "react"
import { Input } from "antd"

import Button from "@ui/Button"
import ConfirmButton from "@ui/ConfirmButton"
import UploadButton from "@components/UploadButton"
import { Icons } from "@components/Icons"

import { useGroupActions, useGroupData } from "@comty/spaces-sdk/group"
import GroupsModel from "@endpoints/groups"

import {
	Settings,
	SettingsHeader,
	SettingsSection,
	SettingsSectionField,
	SettingsSectionFieldContent,
	SettingsSectionFieldLabel,
} from "@/components/Spaces/Group/SettingsPanel/layout"

const GeneralSettings = () => {
	const data = useGroupData()
	const actions = useGroupActions()

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
		const updated = await GroupsModel.modify(data?._id, values)

		actions.setData(updated)

		app.message.success("Group updated")
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
		<Settings>
			<SettingsHeader>
				<h2>
					<Icons.Settings /> General settings
				</h2>

				{hasChanges() ? "Pending changes" : null}
				<Button
					type="primary"
					disabled={!hasChanges()}
					onClick={submit}
				>
					Save
				</Button>
			</SettingsHeader>

			<SettingsSection>
				<SettingsSectionField>
					<SettingsSectionFieldLabel>
						<span>Name</span>
					</SettingsSectionFieldLabel>

					<SettingsSectionFieldContent>
						<Input
							placeholder="Group Name"
							defaultValue={values.name}
							onChange={(e) => {
								updateSetting("name", e.target.value)
							}}
						/>
					</SettingsSectionFieldContent>
				</SettingsSectionField>

				<SettingsSectionField>
					<SettingsSectionFieldLabel>
						<span>Description</span>
					</SettingsSectionFieldLabel>

					<SettingsSectionFieldContent>
						<Input
							placeholder="Group Description"
							defaultValue={values.description}
							onChange={(e) => {
								updateSetting("description", e.target.value)
							}}
						/>
					</SettingsSectionFieldContent>
				</SettingsSectionField>
			</SettingsSection>

			<SettingsSection>
				<SettingsSectionField>
					<SettingsSectionFieldLabel>
						<span>Images</span>
					</SettingsSectionFieldLabel>

					<SettingsSectionFieldContent>
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
					</SettingsSectionFieldContent>
				</SettingsSectionField>
			</SettingsSection>

			<SettingsSection>
				<h3
					style={{
						color: "var(--danger-color)",
					}}
				>
					Danger Zone
				</h3>

				<SettingsSectionField row>
					<SettingsSectionFieldContent>
						<ConfirmButton
							type="danger"
							onConfirm={handleDeleteGroup}
							icon={<Icons.Trash />}
						>
							Delete Group
						</ConfirmButton>

						<ConfirmButton
							type="danger"
							onConfirm={handleLeaveGroup}
							icon={<Icons.LogOut />}
						>
							Leave Group
						</ConfirmButton>
					</SettingsSectionFieldContent>
				</SettingsSectionField>
			</SettingsSection>
		</Settings>
	)
}

export default {
	key: "general",
	label: "General",
	icon: Icons.Settings,
	permission: "UPDATE_GROUP",
	render: GeneralSettings,
}
