import type { SettingTabModule } from "@/pages/settings/types"

import { MAX_USER_SOUNDPAD_ITEMS } from "@comty/shared/types/spaces/soundpad"

import { Icons } from "@components/Icons"

import AddSoundpadItem from "@components/Soundpad/Settings/AddSoundpadItem"
import SoundpadSettingsList from "@components/Soundpad/Settings/SoundpadSettingsList"
import { useSoundpadItems } from "@components/Soundpad/Settings/useSoundpadItems"

import { SettingsGroup, SettingsGroupHeader } from "@/pages/settings/layout"

import "./index.less"

const SoundpadSettingsPage = () => {
	const { items, loading, error, add, update, remove } = useSoundpadItems({
		scope: "user",
	})

	const maxReached = items.length >= MAX_USER_SOUNDPAD_ITEMS

	return (
		<div className="soundpad-settings-page">
			<SettingsGroupHeader>
				<h1>
					<Icons.Drum /> Soundpad
				</h1>
				<p className="soundpad-settings-page__description">
					Your personal sounds can be used in any group or voice
					channel.
				</p>
			</SettingsGroupHeader>

			<AddSoundpadItem
				onSubmit={add}
				maxReached={maxReached}
			/>

			<SettingsGroup>
				<div className="soundpad-settings-page__list-header">
					<h4>My sounds</h4>
					<span>
						{items.length} / {MAX_USER_SOUNDPAD_ITEMS}
					</span>
				</div>

				<SoundpadSettingsList
					items={items}
					loading={loading}
					error={error}
					onUpdate={update}
					onDelete={(item) => remove(item._id!)}
					emptyDescription="You have not added any sounds yet"
				/>
			</SettingsGroup>
		</div>
	)
}

export default {
	id: "soundpad",
	icon: "Drum",
	label: "Soundpad",
	group: "app",
	render: SoundpadSettingsPage,
} satisfies SettingTabModule
