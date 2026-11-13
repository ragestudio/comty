import type { NavigationStoreType } from "./types"

type ChannelReference = {
	_id: string
	group_id: string
}

// checks if the navigation points to the given channel content view
// a voice channel renders without a subview or with the voice subview
export const isChannelView = (
	nav: Pick<NavigationStoreType, "type" | "room" | "channel" | "subview">,
	channel?: ChannelReference | null,
) => {
	if (!channel) return false

	return (
		nav.type === "group" &&
		nav.room === channel.group_id &&
		nav.channel === channel._id &&
		(nav.subview === null || nav.subview === "voice")
	)
}

export default isChannelView
