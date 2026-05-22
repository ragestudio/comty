import MediaRTC from "../mediartc.core"
import GroupModel from "@models/groups"

export default async function (
	this: MediaRTC,
	groupId: string,
	channelId: string,
) {
	try {
		// fetch channel data
		const channelData = await GroupModel.channels.get(groupId, channelId)

		this.console.debug("Joining channel...", {
			groupId,
			channelId,
			self: this,
		})

		const data = await this.socket.call("channel:join", channelData._id)

		this.state.channel = channelData
		this.state.channelId = channelId

		// dispatch sfx
		app.cores.sfx.play("media_channel_join")

		await this.handlers.attachChannel(data)
	} catch (error: any) {
		app.cores.notifications.new({
			title: "Failed to join channel",
			message: error.message,
			type: "error",
		})
	}
}
