import type LoadActions from "./index"

import { CHAT_CONFIGS } from "../../../stores/chat/constants"

export default async function (
	this: LoadActions,
	messageId: string,
): Promise<void> {
	const { type, params, loading } = this.getState()
	if (!type || !params || loading) return

	const generation = this.state.initGeneration
	const config = CHAT_CONFIGS[type]

	this.setState({ loading: true, error: null })

	try {
		const olderResponse = await config.model.get(params, {
			beforeId: messageId,
			limit: 15,
		})
		const newerResponse = await config.model.get(params, {
			afterId: messageId,
			limit: 15,
		})
		const targetMessage =
			type === "group"
				? await this.db.channel_messages.get(messageId)
				: await this.db.direct_messages.get(messageId)

		if (generation !== this.state.initGeneration) return

		const allMessages = [
			...(olderResponse.items || []),
			...(targetMessage ? [targetMessage] : []),
			...(newerResponse.items || []),
		]

		if (allMessages.length > 0) {
			const users = [
				...(olderResponse.users || []),
				...(newerResponse.users || []),
			]

			if (users.length > 0) await this.cache.cacheUsers(users)
			await this.adapter.cacheMessages(allMessages)

			this.state.actions.pushToTimeline(allMessages, "bottom")
		}
	} catch (err: any) {
		console.error("loadAround failed", err)
	} finally {
		if (generation === this.state.initGeneration)
			this.setState({ loading: false })
	}
}
