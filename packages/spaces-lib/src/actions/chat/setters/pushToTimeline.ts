import type SettersActions from "./index"
import type { ExtendedMessage } from "../../../stores/chat/types"

import sortMessages from "../../../utils/sortMessages"

export default function (
	this: SettersActions,
	newMessages: ExtendedMessage[],
	position: "top" | "bottom" = "bottom",
): void {
	this.setState((state) => {
		const combined = [...state.timeline]

		newMessages.forEach((newMsg) => {
			const finalMsg =
				(newMsg as any).status === "sending" ||
				(newMsg as any).status === "error"
					? { ...newMsg }
					: { ...newMsg, status: "sent" as const }

			if (typeof finalMsg.created_at === "string") {
				finalMsg.created_at = new Date(finalMsg.created_at)
			}

			const index = combined.findIndex(
				(m) =>
					m._id === finalMsg._id ||
					(finalMsg.nonce && m.nonce === finalMsg.nonce),
			)

			if (index !== -1) {
				combined[index] = { ...combined[index], ...finalMsg }
			} else {
				combined.push(finalMsg)
			}
		})

		return { timeline: sortMessages(combined) }
	})
}
