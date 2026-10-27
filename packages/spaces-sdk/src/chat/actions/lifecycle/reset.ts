import type LifecycleActions from "./index"

export default function (this: LifecycleActions): void {
	const state = this.getState()

	if (state.typingTimeout) {
		clearTimeout(state.typingTimeout)
	}

	this.setState({
		initGeneration: state.initGeneration + 1,
		isTypingNetworkState: false,
		typingTimeout: null,
		type: null,
		params: null,
		sessionKey: null,
		initialLoading: true,
		loading: false,
		loadingAfter: false,
		afterLoadVersion: 0,
		error: null,
		timeline: [],
		pendingMessages: [],
		hasMoreBefore: true,
		hasMoreAfter: true,
		usersTyping: [],
		isTyping: false,
		pausedUpdates: false,
	})
}
