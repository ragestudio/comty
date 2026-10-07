import channelDisconnected from "./channelDisconnected"
import clientEvent from "./clientEvent"
import clientJoined from "./clientJoined"
import clientLeft from "./clientLeft"
import producerJoined from "./producerJoined"
import producerLeft from "./producerLeft"
import soundpadDispatch from "./soundpadDispatch"

export const events = {
	"media:channel:client:joined": clientJoined,
	"media:channel:client:left": clientLeft,
	"media:channel:client_event": clientEvent,
	"media:channel:producer:joined": producerJoined,
	"media:channel:producer:left": producerLeft,
	"media:channel:soundpad:dispatch": soundpadDispatch,
	"media:channel:disconnected": channelDisconnected,
}

export default events
