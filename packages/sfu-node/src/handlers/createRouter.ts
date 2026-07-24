import type { SFU_Node } from ".."
import type { RouterOptions } from "mediasoup/types"
import type { IPCMsg } from "../ipc"

export default async function (
	this: SFU_Node,
	data: RouterOptions & { channelId?: string; groupId?: string },
	msg: IPCMsg,
) {
	console.log("Creating router with options:", data)

	const router = await this.worker.createRouter({
		mediaCodecs: data.mediaCodecs,
		appData: {
			channelId: data.channelId,
			groupId: data.groupId,
		},
	})

	this.routers.set(router.id, router)

	const dump = await router.dump()

	msg.respond({
		...dump,
		rtpCapabilities: router.rtpCapabilities,
	})
}
