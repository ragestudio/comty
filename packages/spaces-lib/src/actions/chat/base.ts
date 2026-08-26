import { StoreApi } from "zustand"
import { SpacesChatState } from "../../stores/chat/types"

import { getAdapter } from "../../stores/chat/adapters"
import * as cache from "../../helpers/cache"
import db from "../../db"
import getSocket from "../../utils/getSocket"

export type SetChatState = StoreApi<SpacesChatState>["setState"]
export type GetChatState = StoreApi<SpacesChatState>["getState"]

class ChatActionsBase {
	setState: SetChatState
	getState: GetChatState

	constructor(set: SetChatState, get: GetChatState) {
		this.setState = set
		this.getState = get
	}

	get db() {
		return db
	}

	get cache() {
		return cache
	}

	get state() {
		return this.getState()
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
