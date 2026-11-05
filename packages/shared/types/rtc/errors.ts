/**
 * Sent to a client when the media session it was using no longer exists on
 * the sfu. The client must negotiate a new one before using the channel.
 */
export const MEDIA_SESSION_RESET = "Media session was reset, rejoin the channel"

/** the websocket ack carries the message as a plain string */
export function isMediaSessionResetError(error: unknown): boolean {
	if (!error) return false

	return String(error).includes(MEDIA_SESSION_RESET)
}

export default MEDIA_SESSION_RESET
