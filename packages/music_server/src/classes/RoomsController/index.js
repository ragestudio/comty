import Room from "@classes/Room"

export default class RoomsController {
    constructor(io) {
        if (!io) {
            throw new Error("io is required")
        }

        this.io = io
    }

    rooms = []

    checkRoomExists = (roomId) => {
        return this.rooms.some((room) => room.roomId === roomId)
    }

    createRoom = async (roomId, roomOptions) => {
        if (this.checkRoomExists(roomId)) {
            throw new Error(`Room ${roomId} already exists`)
        }

        const room = new Room(this.io, roomId, roomOptions)

        this.rooms.push(room)

        return room
    }

    connectSocketToRoom = async (socket, roomId, roomOptions) => {
        let room = null

        if (!this.checkRoomExists(roomId)) {
            room = await this.createRoom(roomId, roomOptions)

            // make owner
            room.makeOwner(socket)
        }

        // check if user is already connected to a room
        if (socket.connectedRoomId) {
            console.warn(`[${socket.id}][@${socket.userData.username}] already connected to room ${socket.connectedRoomId}`)

            this.disconnectSocketFromRoom(socket)
        }

        if (!room) {
            room = this.rooms.find((room) => room.roomId === roomId)
        }

        return room.join(socket)
    }

    disconnectSocketFromRoom = async (socket, roomId) => {
        if (!roomId) {
            roomId = socket.connectedRoomId
        }

        if (!this.checkRoomExists(roomId)) {
            console.warn(`Cannot disconnect socket [${socket.id}][@${socket.userData.username}] from room ${roomId}, room does not exists`)
            return false
        }

        const room = this.rooms.find((room) => room.roomId === roomId)

        // if owners leaves, rotate owner to the next user
        if (socket.userData._id === room.ownerUserId) {
            if (room.connections.length > 0 && room.connections[1]) {
                room.transferOwner(room.connections[1])
            }
        }

        // leave
        room.leave(socket)

        // if room is empty, destroy it
        if (room.connections.length === 0) {
            await this.destroyRoom(roomId)

            return true
        }

        return true
    }

    destroyRoom = async (roomId) => {
        if (!this.checkRoomExists(roomId)) {
            throw new Error(`Room ${roomId} does not exists`)
        }

        const room = this.rooms.find((room) => room.roomId === roomId)

        room.destroy()

        this.rooms.splice(this.rooms.indexOf(room), 1)

        return true
    }
}
