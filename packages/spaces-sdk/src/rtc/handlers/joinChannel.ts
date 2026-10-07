import type { RTC } from ".."
import type { RTC_JoinPayload } from "@comty/shared/types/rtc/events/index"
import type { JoinChannelResult } from "@comty/shared/types/rtc/handlers/joinChannel"

import { Device } from "mediasoup-client"
import GroupModel from "@comty/api-lib/models/groups"

export async function joinChannel(
	this: RTC,
	{
		groupId,
		channelId,
		dmPair,
	}: { groupId?: string; channelId: string; dmPair?: string },
) {
	if (!this.socket) {
		console.error("Cannot join without socket")
		return null
	}

	if (dmPair) {
		throw new Error("DM pair is not supported yet")
	}

	if (!groupId) {
		throw new Error("Group ID or DMPair is required")
	}

	try {
		this.setState({ state: "loading" })

		const channelData = await GroupModel.channels.get(groupId, channelId)

		this.setState({ channel: channelData })

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

		const data = await this.socket.call<JoinChannelResult>(
			"channel:join",
			payload,
		)

		this.device = await Device.factory()

		await this.device.load({
			routerRtpCapabilities: data.rtpCapabilities,
		})

		console.debug("Channel join data:", data)

		if (!data) {
			console.error(
				"Server did not respond with a valid channel join data",
			)
			throw new Error("Invalid server response")
		}

		await this.handlers.attachChannel(data)

		// TODO: dispatch sfx
	} catch (err: any) {
		console.error("Failed to Join Channel:", err)
		this.setState({
			state: "failed",
		})
	}
}

export default joinChannel
