import type { SFU_Node } from ".."
import type { MsgImpl } from "@nats-io/transport-node"

export default async function (this: SFU_Node, _data: any, msg: MsgImpl) {
	const routers: {
		id: string
		channelId?: string
		groupId?: string
	}[] = []

	for (const [id, router] of this.routers) {
		if (!router.closed) {
			routers.push({
				id: id as string,
				channelId: router.appData?.channelId as string | undefined,
				groupId: router.appData?.groupId as string | undefined,
			})
		}
	}

	msg.respond(JSON.stringify(routers))
}
