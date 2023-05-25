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

function composePayloadData(socket, data = {}) {
    return {
        user: {
            user_id: socket.userData._id,
            username: socket.userData.username,
            fullName: socket.userData.fullName,
            avatar: socket.userData.avatar,
        },
        command_issuer: data.command_issuer ?? socket.userData._id,
        ...data
    }
}

class Room {
    constructor(io, roomId, roomOptions = { title: "Untitled Room" }) {
        if (!io) {
            throw new Error("io is required")
        }

        this.io = io
        this.roomId = roomId
        this.roomOptions = roomOptions
    }

    // declare the maximum audio offset from owner
    static maxOffsetFromOwner = 1

    ownerUserId = null

    connections = []

    limitations = {
        maxConnections: 10,
    }

    currentState = null

    events = {
        "music:player:start": (socket, data) => {
            // dispached when someone start playing a new track
            // if not owner, do nothing
            if (socket.userData._id !== this.ownerUserId) {
                return false
            }

            if (data.state) {
                this.currentState = data.state
            }

            this.io.to(this.roomId).emit("music:player:start", composePayloadData(socket, data))
        },
        "music:player:seek": (socket, data) => {
            // dispached when someone seek the track
            // if not owner, do nothing
            if (socket.userData._id !== this.ownerUserId) {
                return false
            }

            if (data.state) {
                this.currentState = data.state
            }

            this.io.to(this.roomId).emit("music:player:seek", composePayloadData(socket, data))
        },
        "music:player:loading": (socket, data) => {
            // TODO: Softmode and Hardmode
            // Ignore if is the owner
            if (socket.userData._id === this.ownerUserId) {
                return false
            }

            // if not loading, check if need to sync
            if (!data.loading) {
                // try to sync with current state
                if (data.state.time > this.currentState.time + Room.maxOffsetFromOwner) {
                    socket.emit("music:player:seek", composePayloadData(socket, {
                        position: this.currentState.time,
                        command_issuer: this.ownerUserId,
                    }))
                }
            }
        },
        "music:player:status": (socket, data) => {
            if (socket.userData._id !== this.ownerUserId) {
                return false
            }

            if (data.state) {
                this.currentState = data.state
            }

            this.io.to(this.roomId).emit("music:player:status", composePayloadData(socket, data))
        },
        // UPDATE TICK
        "music:state:update": (socket, data) => {
            if (socket.userData._id === this.ownerUserId) {
                // update current state
                this.currentState = data

                return true
            }

            if (!this.currentState) {
                return false
            }

            if (data.loading) {
                return false
            }

            // check if match with current manifest
            if (!data.manifest || data.manifest._id !== this.currentState.manifest._id) {
                socket.emit("music:player:start", composePayloadData(socket, {
                    manifest: this.currentState.manifest,
                    time: this.currentState.time,
                    command_issuer: this.ownerUserId,
                }))
            }

            if (data.firstSync) {
                // if not owner, try to sync with current state
                if (data.time > this.currentState.time + Room.maxOffsetFromOwner) {
                    socket.emit("music:player:seek", composePayloadData(socket, {
                        position: this.currentState.time,
                        command_issuer: this.ownerUserId,
                    }))
                }

                // check if match with current playing status
                if (data.playbackStatus !== this.currentState.playbackStatus && data.firstSync) {
                    socket.emit("music:player:status", composePayloadData(socket, {
                        status: this.currentState.playbackStatus,
                        command_issuer: this.ownerUserId,
                    }))
                }
            }
        },
        // ROOM MODERATION CONTROL
        "room:moderation:kick": (socket, data) => {
            if (socket.userData._id !== this.ownerUserId) {
                return socket.emit("error", {
                    message: "You are not the owner of this room, cannot kick this user",
                })
            }

            const { room_id, user_id } = data

            if (this.roomId !== room_id) {
                console.warn(`[${socket.id}][@${socket.userData.username}] not connected to room ${room_id}, cannot kick`)

                return socket.emit("error", {
                    message: "You are not connected to requested room, cannot kick this user",
                })
            }

            const socket_conn = this.connections.find((socket_conn) => {
                return socket_conn.userData._id === user_id
            })

            if (!socket_conn) {
                console.warn(`[${socket.id}][@${socket.userData.username}] not found user ${user_id} in room ${room_id}, cannot kick`)

                return socket.emit("error", {
                    message: "User not found in room, cannot kick",
                })
            }

            socket_conn.emit("room:moderation:kicked", {
                room_id,
            })

            this.leave(socket_conn)
        },
        "room:moderation:transfer_ownership": (socket, data) => {
            if (socket.userData._id !== this.ownerUserId) {
                return socket.emit("error", {
                    message: "You are not the owner of this room, cannot transfer ownership",
                })
            }

            const { room_id, user_id } = data

            if (this.roomId !== room_id) {
                console.warn(`[${socket.id}][@${socket.userData.username}] not connected to room ${room_id}, cannot transfer ownership`)

                return socket.emit("error", {
                    message: "You are not connected to requested room, cannot transfer ownership",
                })
            }

            const socket_conn = this.connections.find((socket_conn) => {
                return socket_conn.userData._id === user_id
            })

            if (!socket_conn) {
                console.warn(`[${socket.id}][@${socket.userData.username}] not found user ${user_id} in room ${room_id}, cannot transfer ownership`)

                return socket.emit("error", {
                    message: "User not found in room, cannot transfer ownership",
                })
            }

            this.transferOwner(socket_conn)
        }
    }

    join = (socket) => {
        // set connected room name
        socket.connectedRoomId = this.roomId

        // join room
        socket.join(this.roomId)

        // add to connections
        this.connections.push(socket)

        // emit to self
        socket.emit("room:joined", this.composeRoomData())

        // emit to others
        this.io.to(this.roomId).emit("room:user:joined", {
            user: {
                user_id: socket.userData._id,
                username: socket.userData.username,
                fullName: socket.userData.fullName,
                avatar: socket.userData.avatar,
            }
        })

        // register events
        for (const [event, fn] of Object.entries(this.events)) {
            const handler = generateFnHandler(fn, socket)

            if (!Array.isArray(socket.handlers)) {
                socket.handlers = []
            }

            socket.handlers.push([event, handler])

            socket.on(event, handler)
        }

        // send current state
        this.sendRoomData()

        console.log(`[${socket.id}][@${socket.userData.username}] joined room ${this.roomId}`)
    }

    leave = (socket) => {
        // if not connected to any room, do nothing
        if (!socket.connectedRoomId) {
            console.warn(`[${socket.id}][@${socket.userData.username}] not connected to any room`)
            return
        }

        // if not connected to this room, do nothing
        if (socket.connectedRoomId !== this.roomId) {
            console.warn(`[${socket.id}][@${socket.userData.username}] not connected to room ${this.roomId}, cannot leave`)
            return false
        }

        // leave room
        socket.leave(this.roomId)

        // remove from connections
        const connIndex = this.connections.findIndex((socket_conn) => socket_conn.id === socket.id)

        if (connIndex !== -1) {
            this.connections.splice(connIndex, 1)
        }

        // remove connected room name
        socket.connectedRoomId = null

        // emit to self
        socket.emit("room:left", this.composeRoomData())

        // emit to others
        this.io.to(this.roomId).emit("room:user:left", {
            user: {
                user_id: socket.userData._id,
                username: socket.userData.username,
                fullName: socket.userData.fullName,
                avatar: socket.userData.avatar,
            },
        })

        // unregister events
        for (const [event, handler] of socket.handlers) {
            socket.off(event, handler)
        }

        // send current state
        this.sendRoomData()

        console.log(`[${socket.id}][@${socket.userData.username}] left room ${this.roomId}`)
    }

    composeRoomData = () => {
        return {
            roomId: this.roomId,
            limitations: this.limitations,
            ownerUserId: this.ownerUserId,
            options: this.roomOptions,
            connectedUsers: this.connections.map((socket_conn) => {
                return {
                    user_id: socket_conn.userData._id,
                    username: socket_conn.userData.username,
                    fullName: socket_conn.userData.fullName,
                    avatar: socket_conn.userData.avatar,
                }
            }),
            currentState: this.currentState,
        }
    }

    sendRoomData = () => {
        this.io.to(this.roomId).emit("room:current-data", this.composeRoomData())
    }

    transferOwner = (socket) => {
        if (!socket || !socket.userData) {
            console.warn(`[${socket.id}] cannot transfer owner for room [${this.roomId}], no user data`)
            return false
        }

        this.ownerUserId = socket.userData._id

        console.log(`[${socket.id}][@${socket.userData.username}] is now the owner of the room [${this.roomId}]`)

        this.io.to(this.roomId).emit("room:owner:changed", {
            ownerUserId: this.ownerUserId,
        })

        this.sendRoomData()
    }

    destroy = () => {
        for (const socket of this.connections) {
            this.leave(socket)
        }

        this.connections = []

        this.io.to(this.roomId).emit("room:destroyed", {
            room: this.roomId,
        })

        console.log(`Room ${this.roomId} destroyed`)
    }

    makeOwner = (socket) => {
        this.ownerUserId = socket.userData._id
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

export default class RoomsServer {
    constructor(server) {
        this.io = socketio(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            }
        })

        this.RoomsController = new RoomsController(this.io)
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
