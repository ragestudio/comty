import type RTEClient from "linebridge/dist/classes/RtEngine/classes/client"

interface DispatchCallPayload {
	userId?: string
	alternativeSfx?: any
	[key: string]: any
}

export default async (client: RTEClient, payload: DispatchCallPayload = {}) => {
	if (!payload.userId) {
		throw new OperationError(400, "Missing userId")
	}

	return await global.userCalls.dispatch(client, payload)
}
