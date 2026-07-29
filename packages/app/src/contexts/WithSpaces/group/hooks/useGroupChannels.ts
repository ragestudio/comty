import type { Channels } from "../../collections/channel"

import React from "react"
import GroupsModel from "@models/groups"

import { cacheChannels } from "../../helpers/cache"

export const useGroupChannels = (group_id: string) => {
	const [channels, setChannels] = React.useState<Channels>(null as any)

	const fetchChannels = React.useCallback(async () => {
		const res = await GroupsModel.channels.list(group_id)

		setChannels(res)
		await cacheChannels(group_id, res)

		return res
	}, [group_id])

	return { channels, setChannels, fetchChannels }
}
