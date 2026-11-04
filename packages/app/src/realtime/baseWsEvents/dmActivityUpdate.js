import client from "comty.js/core/client"
import { getUser } from "@comty/spaces-sdk/users"

export default async function (data) {
	// only incoming messages should raise a notification
	if (data?.direction !== "incoming") return

	const mainSocket = client.ws.get("main")

	// check if user is not in the room,
	// if not, create a new notification
	if (
		!mainSocket?.topics.subscribed.has(`chat:dm:${data.room_id}`) ||
		!document.hasFocus()
	) {
		const user = getUser(data.to_user_id)
		const name = user?.public_name ?? user?.username ?? "Someone"

		app.cores.notifications.new({
			type: "info",
			os: true,
			title: "New DM Message",
			description: `${name} sent you a message`,
		})
	}
}
