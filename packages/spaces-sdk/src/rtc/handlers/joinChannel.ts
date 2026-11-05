import type { RTC } from ".."
import type { RTC_JoinPayload } from "@comty/shared/types/rtc/events/index"
import type { JoinChannelResult } from "@comty/shared/types/rtc/handlers/joinChannel"

import { Device } from "mediasoup-client"
import GroupEndpoint from "comty.js/endpoints/groups"
import { isMediaSessionResetError } from "@comty/shared/types/rtc/errors"

export async function joinChannel(
	this: RTC,
	{
		groupId,
		channelId,
		dmPair,
	}: { groupId?: string; channelId: string; dmPair?: string },
) {
	if (!this.socket) {
		this.logger.error("Cannot join without socket")
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

		const channelData = await GroupEndpoint.channels.get(groupId, channelId)

		this.setState({ channel: channelData })

		this.logger.debug("Joining channel...", {
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

		const startSession = async () => {
			const data = await this.socket!.call<JoinChannelResult>(
				"channel:join",
				payload,
			)

			if (!data) {
				this.logger.error(
					"Server did not respond with a valid channel join data",
				)
				throw new Error("Invalid server response")
			}

			this.logger.debug("Channel join data:", data)

			this.device = await Device.factory()

			await this.device.load({
				routerRtpCapabilities: data.rtpCapabilities,
			})

			await this.handlers.attachChannel(data)
		}

		try {
			await startSession()
		} catch (error) {
			// the server lost the media session and rebuilt it, a second
			// attempt negotiates a clean one
			if (!isMediaSessionResetError(error)) throw error

			this.logger.warn(
				"Media session was reset by the server, retrying the join",
			)

			await this.handlers.reset()
			this.setState({ channel: channelData })

			await startSession()
		}

		this.eventBus.emit("rtc:channel:joined", this.channel)
	} catch (err: any) {
		// release any media captured during the failed join
		try {
			await this.handlers.reset()
		} catch (resetError) {
			this.logger.error("Error cleaning up failed join:", resetError)
		}

		this.setState({
			state: "failed",
		})

		this.logger.error("Failed to Join Channel:", err)
		this.eventBus.emit("rtc:channel:join_failed", err)
	}
}

export default joinChannel
