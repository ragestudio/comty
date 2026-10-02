import type TypingActions from "./index"

import { CHAT_CONFIGS } from "../../../stores/chat/constants"

export default function (this: TypingActions, isTypingNow = true): void {
	const { type, params, typingTimeout, isTypingNetworkState } =
		this.getState()
	if (!type || !params) return

	const config = CHAT_CONFIGS[type]
	this.setState({ isTyping: isTypingNow })

	if (typingTimeout) clearTimeout(typingTimeout)

	if (isTypingNetworkState !== isTypingNow) {
		this.setState({ isTypingNetworkState: isTypingNow })

		if (this.socket) {
			this.socket
				.call(
					config.methods.typing,
					config.params.typing(params, isTypingNow),
				)
				.catch((err: any) =>
					console.error("error setting typing state:", err),
				)
		}
	}

	if (isTypingNow) {
		this.setState({
			typingTimeout: setTimeout(
				() => this.state.actions.typing(false),
				5000,
			),
		})
	} else {
		this.setState({ typingTimeout: null })
	}
}
