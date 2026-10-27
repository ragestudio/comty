import type LifecycleActions from "./index"
import type { ChatParams, ChatType } from "@/chat/types"

import { CHAT_CONFIGS } from "@/chat/constants"
import { getChatSessionKey } from "@/chat/types"
import sortMessages from "@/utils/sortMessages"
import logger from "@/utils/logger"

export default async function (
	this: LifecycleActions,
	type: ChatType,
	params: ChatParams,
): Promise<void> {
	this.state.actions.reset()
	const generation = this.getState().initGeneration + 1

	this.setState({ initGeneration: generation })

	const config = CHAT_CONFIGS[type]
	if (!config) throw new Error(`invalid chat type: ${type}`)

	this.setState({
		type,
		params,
		sessionKey: getChatSessionKey(type, params),
		initialLoading: true,
	})

	const adapter = this.adapter
	if (!adapter) return

	const cachedMessages = await adapter.getCachedMessages(params, 50)

	if (generation !== this.state.initGeneration) return

	if (cachedMessages.length > 0) {
		this.setState({ timeline: sortMessages(cachedMessages) })
	}

	this.state.actions.sync().catch(logger.error)

	if (cachedMessages.length === 0) {
		await this.state.actions.load()
	} else if (type === "dm") {
		// dm sync is not implemented server side, fill newer messages
		await this.state.actions.loadAfter()
	}

	if (generation === this.state.initGeneration) {
		this.setState({ initialLoading: false })
	}
}
