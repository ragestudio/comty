import type { Setting } from "@/pages/settings/types"

import { getChannel, setChannel } from "./channel"

export const appChannelSetting: Setting = {
	id: "desktop:app_channel",
	component: "Select",
	title: "Release channel",
	defaultValue: getChannel,
	onUpdate: setChannel,
}
