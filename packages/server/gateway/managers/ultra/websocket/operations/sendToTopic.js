export default async function (message, payload) {
	const { topic, event, data } = payload.data

	try {
		await this.gateway.http.uwsApp.publish(
			topic,
			this.codec.encode({
				topic: topic,
				event: event,
				data: data,
			}),
		)

		message.respond(
			this.codec.encode({
				ok: true,
			}),
		)
	} catch (error) {
		console.error(error)

		message.respond(
			this.codec.encode({
				ok: false,
				error: error.message,
			}),
		)
	}
}
