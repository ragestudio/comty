import type FetchingActions from "./index"
import type { Channels } from "@comty/shared/types/spaces/channel"

import GroupsModel from "@models/groups"

import { VALID_CHANNEL_KINDS } from "../../../stores/group/constants"
import { cacheChannels } from "../../../helpers/cache"

export default async function (
	this: FetchingActions,
): Promise<Channels | null> {
	if (!this.state.groupId) return null

	const currentGeneration = this.state.initGeneration

	try {
		const response = await GroupsModel.channels.list(this.state.groupId)
		if (currentGeneration !== this.state.initGeneration) return null

		if (response?.items) {
			const filtered = {
				...response,
				items: response.items.filter((c: any) =>
					VALID_CHANNEL_KINDS.includes(c.kind),
				),
			}

			this.setState({ channels: filtered })
			await cacheChannels(this.state.groupId, filtered)

			return filtered
		}

		return null
	} catch (err: any) {
		console.error("fetchChannels failed", err)
		return null
	}
}
