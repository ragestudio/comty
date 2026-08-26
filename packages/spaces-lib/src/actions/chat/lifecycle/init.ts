import type LifecycleActions from "./index"

import { CHAT_CONFIGS } from "../../../stores/chat/constants"
import sortMessages from "../../../utils/sortMessages"

export default async function (
	this: LifecycleActions,
	type: "group" | "dm",
	params: any,
): Promise<void> {
	this.state.actions.reset()
	const generation = this.getState().initGeneration + 1

	this.setState({ initGeneration: generation })

	const config = CHAT_CONFIGS[type]
	if (!config) throw new Error(`invalid chat type: ${type}`)

	this.setState({ type, params, initialLoading: true })

	const cachedMessages = await this.adapter.getCachedMessages(params, 50)

	if (generation !== this.state.initGeneration) return

	if (cachedMessages.length > 0) {
		this.setState({ timeline: sortMessages(cachedMessages) })
	}

	this.state.actions.sync().catch(console.error)

	if (cachedMessages.length === 0) {
		await this.state.actions.load()
	}

	if (generation === this.state.initGeneration) {
		this.setState({ initialLoading: false })
	}
}
