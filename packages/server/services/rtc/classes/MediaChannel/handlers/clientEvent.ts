import type { MediaChannel } from ".."
import type { RTCClient } from "../../../types"

export default async function (
	this: MediaChannel,
	client: RTCClient,
	payload: any,
) {
	if (!payload.event || !payload.data) {
		throw new Error("Missing required parameters")
	}

	switch (payload.event) {
		case "updateVoiceState": {
			this.updateClientVoiceState(client, payload.data)
			break
		}
	}

	// broadcast to other clients
	this.broadcastToClients(`media:channel:client_event`, {
		userId: client.userId,
		event: payload.event,
		data: payload.data,
		clientVoiceState: client.voiceState,
	})

	this.events.emit("client:event", this, client, payload)
}
