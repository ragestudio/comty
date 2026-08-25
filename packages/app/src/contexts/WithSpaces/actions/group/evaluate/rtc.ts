import type EvaluateActions from "./index"

import GroupsModel from "@models/groups"

export default async function (this: EvaluateActions): Promise<void> {
	if (!this.state.groupId) return

	const currentGeneration = this.state.initGeneration

	try {
		const response = await GroupsModel.rtc.getGroupState(this.state.groupId)
		if (currentGeneration !== this.state.initGeneration) return

		if (Array.isArray(response)) {
			const userIdsToEvaluate = new Set<string>()

			const statedChannels = response.reduce(
				(curr: Record<string, any>, channel: any) => {
					curr[channel._id] = channel
					channel.clients?.forEach((client: any) => {
						if (client.userId) userIdsToEvaluate.add(client.userId)
					})
					return curr
				},
				{},
			)

			this.setState({ statedChannels })

			if (userIdsToEvaluate.size > 0) {
				this.state.actions.evaluateDecorations(
					Array.from(userIdsToEvaluate),
				)
			}
		}
	} catch (err: any) {
		console.error("syncRTCChannels failed", err)
	}
}
