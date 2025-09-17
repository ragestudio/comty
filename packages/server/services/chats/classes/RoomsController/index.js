import Room from "@classes/Room"

export default class RoomsController {
    constructor(io) {
        if (!io) {
            throw new OperationError(500, "io is required")
        }

        this.io = io
    }

    rooms = new Map()

    checkRoomExists = (roomID) => {
        return this.rooms.has(roomID)
    }

    createRoom = async (roomID) => {
        if (this.checkRoomExists(roomID)) {
            throw new OperationError(400, `Room ${roomID} already exists`)
        }

        const room = new Room(this.io, roomID)

        this.rooms.set(roomID, room)

        return room
    }

    connectSocketToRoom = async (socket, roomID) => {
        if (!this.checkRoomExists(roomID)) {
            await this.createRoom(roomID)
        }

        const room = this.rooms.get(roomID)

        return room.handlers.join(socket)
    }

    disconnectSocketFromRoom = async (socket, roomID) => {
        if (!this.checkRoomExists(roomID)) {
            return false
        }

        const room = this.rooms.get(roomID)

        return room.handlers.leave(socket)
    }
}