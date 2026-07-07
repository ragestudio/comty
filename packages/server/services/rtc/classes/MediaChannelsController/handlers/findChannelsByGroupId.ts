import type MediaChannelsController from "../index"
import type { MediaChannel } from "@classes/MediaChannel/index.ts"

export default async function (
	this: MediaChannelsController,
	groupId: string,
): Promise<MediaChannel[]> {
	return Array.from(this.instances.values()).filter((channelInstance) => {
		return channelInstance.data.group_id === groupId
	})
}
