import type LoadActions from "./index"

import { CHAT_CONFIGS } from "../../../stores/chat/constants"

export default async function (
	this: LoadActions,
	{ beforeId, afterId, limit = 30 }: any = {},
): Promise<void> {
	const { type, params, loading } = this.getState()
	if (!type || !params || loading) return

	const generation = this.state.initGeneration
	const config = CHAT_CONFIGS[type]

	this.setState({ loading: true, error: null })

	try {
		const cached = await this.adapter.getCachedMessages(
			params,
			limit,
			beforeId,
			afterId,
		)

		if (generation !== this.state.initGeneration) return

		if (cached.length > 0) {
			await this.db.users
				.where("_id")
				.anyOf(cached.map((m: any) => m.user_id))
				.toArray()

			this.state.actions.pushToTimeline(
				cached,
				afterId ? "top" : "bottom",
			)
		}

		if (cached.length < limit || afterId) {
			const response = await config.model.get(params, {
				limit,
				beforeId,
				afterId,
			})
			if (generation !== this.state.initGeneration) return

			if (response.items.length > 0) {
				if (response.users) await this.cache.cacheUsers(response.users)

				await this.adapter.cacheMessages(response.items)

				this.state.actions.pushToTimeline(
					response.items,
					afterId ? "top" : "bottom",
				)
			} else if (!afterId) {
				this.setState({ hasMore: false })
			}
		}
	} catch (err: any) {
		if (generation === this.state.initGeneration)
			this.setState({ error: err })
	} finally {
		if (generation === this.state.initGeneration)
			this.setState({ loading: false })
	}
}
