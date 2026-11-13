import React from "react"

import { Icons } from "@components/Icons"
import { useGroupData } from "@comty/spaces-sdk/group"

import AddSoundpadItem from "@components/Soundpad/Settings/AddSoundpadItem"
import SoundpadSettingsList from "@components/Soundpad/Settings/SoundpadSettingsList"
import { useSoundpadItems } from "@components/Soundpad/Settings/useSoundpadItems"

import {
	Settings,
	SettingsHeader,
	SettingsSection,
	SettingsSectionFieldLabel,
} from "@/components/Spaces/Group/SettingsPanel/layout"

export const SoundpadSettings = () => {
	const group = useGroupData()

	const { items, loading, error, add, update, remove } = useSoundpadItems({
		scope: "group",
		groupId: group?._id,
	})

	const groupItems = items.filter(
		(item) => !item.built_in && item.scope !== "builtin",
	)

	return (
		<Settings>
			<SettingsHeader>
				<h2>
					<Icons.Drum /> Soundpad
				</h2>
			</SettingsHeader>

			<AddSoundpadItem onSubmit={add} />

			<SettingsSection>
				<SettingsSectionFieldLabel>
					<h4>Group sounds</h4>
				</SettingsSectionFieldLabel>

				<SoundpadSettingsList
					items={groupItems}
					loading={loading}
					error={error}
					onUpdate={update}
					onDelete={(item) => remove(item._id!)}
					emptyDescription="No group sounds added yet"
				/>
			</SettingsSection>
		</Settings>
	)
}

export default SoundpadSettings
