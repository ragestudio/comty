import socketio from "socket.io"
import generateFnHandler from "@utils/generateFnHandler"

import withWsAuth from "@middlewares/withWsAuth"

import RoomsController from "@classes/RoomsController"

export default class WebsocketServer {
    constructor(server) {
        this.io = socketio(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            }
        })

        if (global.ioAdapter) {
            this.io.adapter(global.ioAdapter)
        }

        this.RoomsController = new RoomsController(this.io)

        return this
    }

    connectionPool = []

    events = {

    }

    inviteUserToRoom = async (socket, data) => {
        try {
            // find sockets with matching user_id
            const invitedSockets = this.connectionPool.filter((client) => client.userData._id === data.user_id)

            if (invitedSockets.length === 0) {
                console.warn(`[${socket.id}][@${socket.userData.username}] cannot invite user ${data.user_id}, user not found in connection pool`)
                return socket.emit("error", {
                    message: `User ${data.user_id} not found`,
                })
            }

            for (const invitedSocket of invitedSockets) {
                // check if user is already connected to the room
                if (invitedSocket.connectedRoomId === data.roomId) {
                    console.warn(`[${socket.id}][@${socket.userData.username}] cannot invite user ${data.user_id}, user already connected to room ${data.roomId}`)
                    return false
                }

                console.log(`[${socket.id}][@${socket.userData.username}] inviting user ${data.user_id} to room ${data.roomId}`)

                invitedSocket.emit("invite:received", {
                    roomId: data.roomId,
                    invitedBy: {
                        _id: socket.userData._id,
                        username: socket.userData.username,
                        fullName: socket.userData.fullName,
                        avatar: socket.userData.avatar,
                    },
                })
            }
        } catch (error) {
            return socket.emit("error", {
                message: error.message,
            })
        }
    }

    initialize = async () => {
        this.io.use(withWsAuth)

        this.io.on("connection", (socket) => {
            try {
                console.log(`[${socket.id}][${socket.userData.username}] connected to hub.`)

                this.connectionPool.push(socket)

                socket.on("disconnect", () => this.events.disconnect)

                // Rooms
                socket.on("join:room", (data) => this.RoomsController.connectSocketToRoom(socket, data.room, data.options))
                socket.on("leave:room", (data) => this.RoomsController.disconnectSocketFromRoom(socket, data?.room ?? socket.connectedRoomId, data?.options ?? {}))
                socket.on("invite:user", generateFnHandler(this.inviteUserToRoom, socket))

                socket.on("ping", (callback) => {
                    callback()
                })

                socket.on("disconnect", (_socket) => {
                    console.log(`[${socket.id}][@${socket.userData.username}] disconnected to hub.`)

                    if (socket.connectedRoomId) {
                        console.log(`[${socket.id}][@${socket.userData.username}] was connected to room [${socket.connectedRoomId}], leaving...`)
                        this.RoomsController.disconnectSocketFromRoom(socket)
                    }

                    // remove from connection pool
                    this.connectionPool = this.connectionPool.filter((client) => client.id !== socket.id)
                })

                Object.entries(this.events).forEach(([event, handler]) => {
                    socket.on(event, (data) => {
                        try {
                            handler(socket, data)
                        } catch (error) {
                            console.error(error)
                        }
                    })
                })
            } catch (error) {
                console.error(error)
            }
        })
    }
}
