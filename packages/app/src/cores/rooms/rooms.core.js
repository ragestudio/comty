import Core from "evite/src/core"
import socketio from "socket.io-client"
import remotes from "comty.js/remotes"
import SessionModel from "comty.js/models/session"

export default class RoomsController extends Core {
    static namespace = "rooms"

    connectedRooms = []

    connectToRoom = async (roomId) => {
        if (!this.checkRoomExists(roomId)) {
            await this.createRoom(roomId)
        }

        const room = this.createRoomSocket(roomId)

        this.connectedRooms.push(room)

        return room
    }

    disconnectFromRoom = async (roomId) => {
        if (!this.checkRoomExists(roomId)) {
            throw new Error(`Room ${roomId} does not exist`)
        }

        const room = this.connectedRooms.find((room) => room.roomId === roomId)

        room.leave()

        this.connectedRooms = this.connectedRooms.filter((room) => room.roomId !== roomId)

        return room
    }

    checkRoomExists = (roomId) => {
        return this.connectedRooms.some((room) => room.roomId === roomId)
    }

    createRoomSocket = async (roomId) => {
        let roomInterface = {
            roomId: roomId,
            socket: socketio(remotes.chat.origin, {
                transports: ["websocket"],
                query: {
                    room: roomId,
                },
                auth: SessionModel.token,
                autoConnect: true,
            }),
        }

        room.leave = () => {
            roomInterface.socket.disconnect()
        }

        return roomInterface
    }
}