export class SyncRoom {
	constructor(ownerSocket) {
		this.ownerSocket = ownerSocket
	}

	id = global.nanoid()

	buffer = new Set()
	members = new Set()

	push = async (data) => {
		if (this.buffer.size > 5) {
			this.buffer.delete(this.buffer.keys().next().value)
		}

		this.buffer.add(data)

		for (const socket of this.members) {
			socket.emit(`syncroom:push`, data)
		}
	}

	join = (socket) => {
		this.members.add(socket)

		// send the latest buffer
		socket.emit("syncroom.buffer", this.buffer[0])
	}

	leave = (socket) => {
		this.members.delete(socket)
	}
}

export default class SyncRoomManager {}
