export default async function (socket) {
	console.log(`Socket ${socket.id} connected to realtime posts`)
	socket.join("global:posts:realtime")
}
