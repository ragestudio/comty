import buildFunctionHandler from "@utils/buildFunctionHandler"

export default class Room {
    constructor(io, roomID, options) {
        if (!io) {
            throw new OperationError(500, "io is required")
        }

        this.io = io

        if (!roomID) {
            throw new OperationError(500, "roomID is required")
        }

        this.roomID = `room:${roomID}`
        this.roomSocket = this.io.to(`room:${this.roomID}`)
        this.options = {
            owner_user_id: null,
            ...options,
        }
    }

    connections = new Set()

    limitations = {
        maxMessageLength: 540,
    }

    roomEvents = {
        "room:change:owner": (client, payload) => {
            throw new OperationError(500, "Not implemented")
        },
        "room:send:message": (client, payload) => {
            console.log(`[${this.roomID}] [@${client.userData.username}] sent message >`, payload)

            let { message } = payload

            if (!message || typeof message !== "string") {
                throw new Error("Invalid message")
            }

            if (message.length > this.limitations.maxMessageLength) {
                message = message.substring(0, this.limitations.maxMessageLength)
            }

            this.handlers.broadcastToMembers("room:message", {
                timestamp: payload.timestamp ?? Date.now(),
                content: String(message),
                user: {
                    user_id: client.userData._id,
                    username: client.userData.username,
                    fullName: client.userData.fullName,
                    avatar: client.userData.avatar,
                },
            })
        }
    }

    handlers = {
        join: (client) => {
            if (client.connectedRoomID) {
                console.warn(`[${client.id}][@${client.userData.username}] already connected to room ${client.connectedRoomID}`)

                client.leave(client.connectedRoomID)
            }

            console.log(`[${client.id}][@${client.userData.username}] joined room ${this.roomID}`)

            client.connectedRoomID = this.roomID

            this.connections.add(client)

            for (let [event, handler] of Object.entries(this.roomEvents)) {
                handler = buildFunctionHandler(handler, client)

                if (!Array.isArray(client.handlers)) {
                    client.handlers = []
                }

                client.handlers.push([event, handler])

                client.on(event, handler)
            }

            // emit to self
            client.emit("room:joined", {
                roomID: this.roomID,
                limitations: this.limitations,
                connectedUsers: this.getConnectedUsers(),
            })

            // emit to others
            this.roomSocket.emit("room:user:joined", {
                user: {
                    user_id: client.userData._id,
                    username: client.userData.username,
                    fullName: client.userData.fullName,
                    avatar: client.userData.avatar,
                }
            })
        },
        leave: (client) => {
            if (!client.connectedRoomID) {
                console.warn(`[${client.id}][@${client.userData.username}] not connected to any room`)
                return
            }

            if (client.connectedRoomID !== this.roomID) {
                console.warn(`[${client.id}][@${client.userData.username}] not connected to room ${this.roomID}, cannot leave`)
                return false
            }

            this.connections.delete(client)

            client.emit("room:left", {
                room: this.roomID,
            })

            this.roomSocket.emit("room:user:left", {
                user: {
                    user_id: client.userData._id,
                    username: client.userData.username,
                    fullName: client.userData.fullName,
                    avatar: client.userData.avatar,
                }
            })

            for (const [event, handler] of client.handlers) {
                client.off(event, handler)
            }

            console.log(`[${client.id}][@${client.userData.username}] left room ${this.roomID}`)
        },
        broadcastToMembers: (event, payload) => {
            for (const client of this.connections) {
                client.emit(event, payload)
            }
        }
    }

    getConnectedUsers = () => {
        let users = {}

        for (const client of this.connections) {
            users[client.userData._id] = client.userData
        }

        return users
    }
}