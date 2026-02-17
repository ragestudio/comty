import UserAvatar from "@components/UserAvatar"

export default async function (data) {
	const mainSocket = this.client.ws.sockets.get("main")

	// check if user is not in the room,
	// if not, create a new notification
	if (!mainSocket.topics.subscribed.has(`chat:dm:${data.room_id}`)) {
		app.cores.notifications.new({
			title: "New message",
			icon: React.createElement(UserAvatar, {
				user_id: data.to_user_id,
			}),
			actions: [
				{
					label: "Open",
					onClick: () => {
						app.location.push(`/spaces/dm/${data.to_user_id}`)
					},
				},
			],
		})
	}
}
