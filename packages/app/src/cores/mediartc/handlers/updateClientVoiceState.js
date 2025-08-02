export default async function (userId, update) {
	for await (const c of this.state.clients) {
		if (c.userId === userId) {
			c.voiceState = {
				...c.voiceState,
				...update,
			}
		}
	}
}
