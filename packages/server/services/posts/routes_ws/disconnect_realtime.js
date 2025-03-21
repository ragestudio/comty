export default async function (socket) {
	console.log(`Socket ${socket.id} disconnected from realtime posts`)
	socket.leave("global:posts:realtime")
}
