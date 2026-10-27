import type { ExtendedMessage as Message } from "@comty/spaces-sdk/chat/types"

export function getTimestamp(value: Message["created_at"]) {
	if (value instanceof Date) return value.getTime()
	if (!value) return Number.NaN

	return new Date(value).getTime()
}

// merge consecutive messages from the same user within a 3 minute window
export function shouldMergeWithNextItem(
	nextItem: Message | undefined,
	item: Message,
) {
	if (!nextItem) {
		return false
	}

	if (nextItem.user_id !== item.user_id) {
		return false
	}

	if (nextItem.flags?.includes("system") || item.flags?.includes("system")) {
		return false
	}

	const nextItemCreatedAt = getTimestamp(nextItem.created_at)
	const currentCreatedAt = getTimestamp(item.created_at)

	if (
		!Number.isFinite(nextItemCreatedAt) ||
		!Number.isFinite(currentCreatedAt)
	) {
		return false
	}

	const timeDiff = (currentCreatedAt - nextItemCreatedAt) / 60_000

	return timeDiff <= 3
}
