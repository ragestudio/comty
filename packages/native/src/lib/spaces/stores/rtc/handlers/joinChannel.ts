import type { RTC } from ".."
import type { RTC_JoinPayload } from "@comty/shared/types/rtc/events/index"

import GroupModel from "@models/groups"

export async function joinChannel(
	this: RTC,
	groupId: string,
	channelId: string,
) {
	if (!this.socket) {
		console.error("Cannot join without socket")
		return null
	}

	try {
		const channelData = await GroupModel.channels.get(groupId, channelId)

		console.debug("Joining channel...", {
			groupId,
			channelId,
			self: this,
			channelData: channelData,
		})

		const payload: RTC_JoinPayload = {
			is_dm: false,
			channel_id: channelData._id,
			group_id: groupId,
		}

		const data = await this.socket.call("channel:join", payload)

		console.debug("Channel join data:", data)

		if (!data) {
			console.error(
				"Server did not respond with a valid channel join data",
			)
			throw new Error("Invalid server response")
		}

		this.setState({
			channel: channelData,
			channelId: channelId,
			connected: true,
		})
	} catch (err: any) {}
}

export default joinChannel
