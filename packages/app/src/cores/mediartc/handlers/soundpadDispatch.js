export default async function (payload) {
	await this.socket.call("channel:soundpad_dispatch", payload)
}
