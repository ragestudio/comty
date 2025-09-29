import Operations from "../operations"

export default async function (message) {
	const payload = this.codec.decode(message.data)

	if (typeof Operations[payload.type] !== "function") {
		return message.respond(
			this.codec.encode({ error: "Invalid operation" }),
		)
	}

	const operation = Operations[payload.type]

	try {
		await operation.bind(this)(message, payload)
	} catch (error) {
		console.error(error)
		message.respond(this.codec.encode({ error: error.message }))
	}
}
