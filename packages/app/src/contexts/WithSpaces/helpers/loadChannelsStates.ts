import { StatedChannels } from "../collections/channel"

export default async ({
	channels,
	groupState,
}: {
	channels: StatedChannels
	groupState: any
}) => {
	if (!groupState) {
		throw new Error("`groupState` is not defined")
	}

	if (!channels && !Array.isArray(channels?.items)) {
		throw new Error("`channels.items` is not array")
	}

	// iterate all provided channels
	for (let channel of channels.items) {
		// mutate with the state objects
		channel.clients = []
		channel.producers = []
		channel.started_at = null

		// check if has states for channels
		if (!Array.isArray(groupState.channels)) {
			continue
		}

		// find the state
		const chState = groupState.channels.find(
			(_c: any) => _c._id === channel._id,
		)

		// if not founded, just continue with the next
		if (!chState) {
			continue
		}

		if (chState.clients) {
			channel.clients = chState.clients
		}

		if (chState.producers) {
			channel.producers = chState.producers
		}

		if (chState.started_at) {
			channel.started_at = chState.started_at
		}
	}

	return channels
}
