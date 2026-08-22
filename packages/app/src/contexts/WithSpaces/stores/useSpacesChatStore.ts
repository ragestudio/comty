import { create } from "zustand"
import { SpacesChatStoreType } from "./chat/types"

import { createHelpers } from "./chat/actions/helpers"
import { createLifecycle } from "./chat/actions/lifecycle"
import { createLoading } from "./chat/actions/loading"
import { createSync } from "./chat/actions/sync"
import { createMessaging } from "./chat/actions/messaging"
import { createTyping } from "./chat/actions/typing"
import { createEvents } from "./chat/actions/events"

export const useSpacesChatStore = create<SpacesChatStoreType>()((set, get) => ({
	type: null,
	params: null,
	initialLoading: true,
	loading: false,
	error: null,
	timeline: [],
	hasMore: true,
	usersTyping: [],
	isTyping: false,
	pausedUpdates: false,

	actions: {
		...createHelpers(set, get),
		...createLifecycle(set, get),
		...createLoading(set, get),
		...createSync(set, get),
		...createMessaging(set, get),
		...createTyping(set, get),
		...createEvents(set, get),
	},
}))
