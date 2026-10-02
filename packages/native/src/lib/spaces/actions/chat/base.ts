import type { ChatStoreType } from "../../stores/chat/types"
import ActionsBase from "../base"

import * as cache from "../../helpers/cache"
import { getAdapter } from "../../stores/chat/adapters"
import db from "../../db"
import getSocket from "../../utils/getSocket"

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
