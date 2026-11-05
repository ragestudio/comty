import type { MediaChannel } from ".."
import type { RTCClient } from "../../../types"

/**
 * Applies a client event and forwards it to the rest of the channel. The
 * voice state is read from the stored client, a remote call only carries a
 * proxy of it.
 */
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

	const stored = Array.from(this.clients).find(
		(c) => c.userId === client.userId,
	)

	// broadcast to other clients
	this.broadcastToClients(`media:channel:client_event`, {
		userId: client.userId,
		event: payload.event,
		data: payload.data,
		clientVoiceState: stored?.voiceState ?? client.voiceState,
	})

	// the stored client carries the updated voice state and the profile, a
	// remote call only has a proxy of it
	this.events.emit("client:event", this, stored ?? client, payload)
}
