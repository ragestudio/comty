import type RTEClient from "linebridge/dist/classes/RtEngine/classes/client"

export default async (client: RTEClient, payload: any = {}) => {
	return await global.userCalls.leave(client, payload)
}
