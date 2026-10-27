import type LoadActions from "./index"

import { CHAT_CONFIGS } from "@/chat/constants"
import logger from "@/utils/logger"

export default async function (
	this: LoadActions,
	{ beforeId, afterId, limit = 30 }: any = {},
): Promise<void> {
	if (!this.adapter) return

	const { type, params, loading, hasMoreBefore } = this.getState()

	if (!type || !params || loading) return

	const isAfter = Boolean(afterId)

	if (!isAfter && !hasMoreBefore) return

	const generation = this.state.initGeneration
	const config = CHAT_CONFIGS[type]
	const oldestIdBefore =
		this.state.timeline[this.state.timeline.length - 1]?._id
	const newestIdBefore = this.state.timeline[0]?._id

	this.setState({ loading: true, loadingAfter: isAfter, error: null })

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
				isAfter ? "top" : "bottom",
			)
		}

		if (cached.length < limit || isAfter) {
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
					isAfter ? "top" : "bottom",
				)

				if (isAfter) {
					this.setState({
						hasMoreAfter: response.items.length >= limit,
					})
				} else if (response.items.length < limit) {
					this.setState({ hasMoreBefore: false })
				}
			} else {
				this.setState(
					isAfter
						? { hasMoreAfter: false }
						: { hasMoreBefore: false },
				)
			}
		}

		// a page that did not extend the oldest message means there is no more
		// history, this also stops any auto-load loop
		if (
			!isAfter &&
			this.state.timeline[this.state.timeline.length - 1]?._id ===
				oldestIdBefore
		) {
			this.setState({ hasMoreBefore: false })
		}

		// no newer message was added, stop retrying the same after page
		if (isAfter && this.state.timeline[0]?._id === newestIdBefore) {
			this.setState({ hasMoreAfter: false })
		}
	} catch (err: any) {
		logger.error(err)

		if (generation === this.state.initGeneration)
			this.setState({ error: err })
	} finally {
		if (generation === this.state.initGeneration) {
			this.setState((state) => ({
				loading: false,
				loadingAfter: false,
				afterLoadVersion: isAfter
					? state.afterLoadVersion + 1
					: state.afterLoadVersion,
			}))
		}
	}
}
