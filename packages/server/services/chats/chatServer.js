import socketio from "socket.io"

import withWsAuth from "@middlewares/withWsAuth"

function generateFnHandler(fn, socket) {
    return async (...args) => {
        if (typeof socket === "undefined") {
            socket = arguments[0]
        }

        try {
            fn(socket, ...args)
        } catch (error) {
            console.error(`[HANDLER_ERROR] ${error.message} >`, error.stack)

            if (typeof socket.emit !== "function") {
                return false
            }

            return socket.emit("error", {
                message: error.message,
            })
        }
    }
}

class Room {
    constructor(io, roomName) {
        if (!io) {
            throw new Error("io is required")
        }

        this.io = io
        this.roomName = roomName
    }

    connections = []

    limitations = {
        maxMessageLength: 540,
    }

    events = {
        "room:send:message": (socket, payload) => {
            let { message } = payload

            if (!message || typeof message !== "string") {
                return socket.emit("error", {
                    message: "Invalid message",
                })
            }

            if (message.length > this.limitations.maxMessageLength) {
                message = message.substring(0, this.limitations.maxMessageLength)
            }

            this.io.to(this.roomName).emit("room:recive:message", {
                timestamp: payload.timestamp ?? Date.now(),
                content: String(message),
                user: {
                    user_id: socket.userData._id,
                    username: socket.userData.username,
                    fullName: socket.userData.fullName,
                    avatar: socket.userData.avatar,
                },
            })
        }
    }

    join = (socket) => {
        if (socket.connectedRoom) {
            console.warn(`[${socket.id}][@${socket.userData.username}] already connected to room ${socket.connectedRoom}`)

            this.leave(socket)
        }

        socket.connectedRoom = this.roomName

        // join room
        socket.join(this.roomName)

        // add to connections
        this.connections.push(socket)

        // emit to self
        socket.emit("room:joined", {
            room: this.roomName,
            limitations: this.limitations,
            connectedUsers: this.connections.map((socket_conn) => {
                return socket_conn.userData._id
            }),
        })

        // emit to others
        this.io.to(this.roomName).emit("room:user:joined", {
            user: {
                user_id: socket.userData._id,
                username: socket.userData.username,
                fullName: socket.userData.fullName,
                avatar: socket.userData.avatar,
            }
        })

        for (const [event, fn] of Object.entries(this.events)) {
            const handler = generateFnHandler(fn, socket)

            if (!Array.isArray(socket.handlers)) {
                socket.handlers = []
            }

            socket.handlers.push([event, handler])

            socket.on(event, handler)
        }

        console.log(`[${socket.id}][@${socket.userData.username}] joined room ${this.roomName}`)
    }

    leave = (socket) => {
        if (!socket.connectedRoom) {
            console.warn(`[${socket.id}][@${socket.userData.username}] not connected to any room`)
            return
        }

        if (socket.connectedRoom !== this.roomName) {
            console.warn(`[${socket.id}][@${socket.userData.username}] not connected to room ${this.roomName}, cannot leave`)
            return false
        }

        socket.leave(this.roomName)

        this.connections.splice(this.connections.indexOf(socket), 1)

        socket.emit("room:left", {
            room: this.roomName,
        })

        this.io.to(this.roomName).emit("room:user:left", {
            user: {
                user_id: socket.userData._id,
                username: socket.userData.username,
                fullName: socket.userData.fullName,
                avatar: socket.userData.avatar,
            }
        })

        for (const [event, handler] of socket.handlers) {
            socket.off(event, handler)
        }

        console.log(`[${socket.id}][@${socket.userData.username}] left room ${this.roomName}`)
    }
}

class RoomsController {
    constructor(io) {
        if (!io) {
            throw new Error("io is required")
        }

        this.io = io
    }

    rooms = []

    checkRoomExists = (roomName) => {
        return this.rooms.some((room) => room.roomName === roomName)
    }

    createRoom = async (roomName) => {
        if (this.checkRoomExists(roomName)) {
            throw new Error(`Room ${roomName} already exists`)
        }

        const room = new Room(this.io, roomName)

        this.rooms.push(room)

        return room
    }

    connectSocketToRoom = async (socket, roomName) => {
        if (!this.checkRoomExists(roomName)) {
            await this.createRoom(roomName)
        }

        const room = this.rooms.find((room) => room.roomName === roomName)

        return room.join(socket)
    }

    disconnectSocketFromRoom = async (socket, roomName) => {
        if (!this.checkRoomExists(roomName)) {
            return false
        }

        const room = this.rooms.find((room) => room.roomName === roomName)

        return room.leave(socket)
    }
}

export default class ChatServer {
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
    }

    connectionPool = []

    events = {
        "connection": (socket) => {
            console.log(`[${socket.id}][${socket.userData.username}] connected to hub.`)

            this.connectionPool.push(socket)

            socket.on("disconnect", () => this.events.disconnect)

            // Rooms
            socket.on("join:room", (data) => this.RoomsController.connectSocketToRoom(socket, data.room))
            socket.on("leave:room", (data) => this.RoomsController.disconnectSocketFromRoom(socket, data?.room ?? socket.connectedRoom))
        },
        "disconnect": (socket) => {
            console.log(`[${socket.id}][@${socket.userData.username}] disconnected to hub.`)

            if (socket.connectedRoom) {
                this.Rooms.leave(socket)
            }

            // remove from connection pool
            this.connectionPool = this.connectionPool.filter((client) => client.id !== socket.id)
        },
    }

    initialize = async () => {
        this.io.use(withWsAuth)

        Object.entries(this.events).forEach(([event, handler]) => {
            this.io.on(event, (socket) => {
                try {
                    handler(socket)
                } catch (error) {
                    console.error(error)
                }
            })
        })
    }
}
