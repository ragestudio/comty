import type LifecycleActions from "./index"

import logger from "@/utils/logger"

export default function (this: LifecycleActions, paused: boolean): void {
	if (this.state.pausedUpdates === paused) return

	this.setState({ pausedUpdates: paused })

	if (paused) return

	const pendingMessages = this.state.pendingMessages

	if (pendingMessages.length > 0) {
		this.setState({ pendingMessages: [] })
	}

	// allow a recovery pass even if a previous loadAfter reached the end
	this.setState({ hasMoreAfter: true })

	// capture the current newest message before flushing the pending ones, so
	// loadAfter can also fill any gap caused by a disconnected socket
	this.state.actions.loadAfter().catch(logger.error)

	if (pendingMessages.length > 0) {
		this.state.actions.pushToTimeline(pendingMessages, "bottom")
	}
}
