import type MediaChannelsController from ".."
import type { SerializedMediaChannel } from "@classes/MediaChannel"

/**
 * Closes the sfu router of an unusable session and drops its persisted state,
 * so it is not restored again. Only called when the current controller owns
 * the claim, otherwise the session may still be served by another node.
 */
export default async function (
	this: MediaChannelsController,
	channelId: string,
	state?: SerializedMediaChannel | null,
	{ closeRouter = true }: { closeRouter?: boolean } = {},
) {
	if (closeRouter && state?.router_id && state?.sfu_node_id) {
		const sfuNode = this.sfuDiscovery.nodes.find(
			(node) => node.node_id.toString() === String(state.sfu_node_id),
		)

		if (sfuNode) {
			try {
				const router = await sfuNode.getRouter(state.router_id)
				router?.close()
			} catch {
				// the sfu node is unreachable, nothing to close
			}
		}
	}

	await this.mediaChannelsStateBucket.delete(channelId)
}
