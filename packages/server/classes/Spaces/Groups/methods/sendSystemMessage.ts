//import ChatChannel from "@shared-classes/Spaces/ChatChannel"
import GroupChannels from "@shared-classes/Spaces/GroupChannels"
import ChannelMessagesModel from "@db/channel_messages"

export default async function (group_id: string, message: string) {
	const channels = await GroupChannels.getAllByGroup({
		_id: group_id,
	} as any)
	const generalChannel = channels.find((ch: any) => ch.kind === "chat")

	if (!generalChannel) return

	const _id = global.snowflake.nextId().toString()
	const msg = ChannelMessagesModel.obj({
		_id: _id,
		channel_id: generalChannel._id,
		user_id: "0",
		message: message,
		flags: ["system"],
		created_at: new Date(),
	})

	await msg.save()

	if (global.websockets) {
		global.websockets.senders.toTopic(
			`chats:channel:${generalChannel._id}`,
			"channel:message",
			msg.toRaw(),
		)
	}
}
