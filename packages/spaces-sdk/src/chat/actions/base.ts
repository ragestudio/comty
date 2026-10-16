import type { ChatStoreType } from "@/chat/types"
import ActionsBase from "@/classes/BaseActions"
import { getSocket } from "@/helpers/socket"
import db from "@/db"

import * as cache from "@/helpers/cache"
import { getAdapter } from "@/chat/adapters"

class ChatActionsBase extends ActionsBase<ChatStoreType> {
	get db() {
		return db
	}

	get cache() {
		return cache
	}

	get adapter() {
		const { type } = this.getState()

		if (!type) return null

		return getAdapter(type)
	}

	get socket() {
		return getSocket()
	}
}

export default ChatActionsBase
