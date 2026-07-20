import MediaRTC from "../mediartc.core"
import GroupModel from "@models/groups"

export default async function (
	this: MediaRTC,
	groupId: string,
	channelId: string,
) {
	// mark that we are intentionally switching channels to prevent
	// auto-recovery from triggering on the disconnection of the old channel
	this._switchingToChannelId = channelId

	try {
		// fetch channel data
		const channelData = await GroupModel.channels.get(groupId, channelId)

		this.console.debug("Joining channel...", {
			groupId,
			channelId,
			self: this,
		})

		const data = await this.socket.call("channel:join", {
			is_dm: false,
			channel_id: channelData._id,
			group_id: groupId,
		})

		this.console.debug("Channel join data:", data)

		if (!data) {
			console.error(
				"Server did not respond with a valid channel join data",
			)
			throw new Error("Invalid server response")
		}

		this._switchingToChannelId = null

		this._joinedGroupId = groupId
		this.state.channel = channelData
		this.state.channelId = channelId

		await this.handlers.attachChannel(data)

		// dispatch sfx
		app.cores.sfx.play("media_channel_join")

		await this.sendVoiceStateUpdate()
	} catch (error: any) {
		this._switchingToChannelId = null

		if (!this.autoRecovery.isRecovering) {
			app.cores.notifications.new({
				title: "Failed to join channel",
				message: error.message,
				type: "error",
			})
		}

		throw error
	}
}
