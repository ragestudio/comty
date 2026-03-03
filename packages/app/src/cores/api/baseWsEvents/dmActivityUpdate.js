import UserAvatar from "@components/UserAvatar"

export default async function (data) {
	console.log("dmActivityUpdate", data)

	const mainSocket = this.client.ws.sockets.get("main")

	// check if user is not in the room,
	// if not, create a new notification
	if (
		!mainSocket.topics.subscribed.has(`chat:dm:${data.room_id}`) ||
		!document.hasFocus()
	) {
		app.cores.notifications.new({
			os: true,
			title: "New DM Message",
			description: `${data.to_user_id} send you a message`,
		})
	}
}
