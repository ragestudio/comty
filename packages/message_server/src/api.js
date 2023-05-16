import fs from "fs"
import path from "path"

import express from "express"
import http from "http"
import socketio from "socket.io"
import EventEmitter from "@foxify/events"
import jwt from "jsonwebtoken"
import axios from "axios"

import routes from "./routes"

const mainAPI = axios.create({
    baseURL: process.env.MAIN_API_URL ?? "http://localhost:3010",
    headers: {
        Authorization: `Server ${process.env.MAIN_SERVER_ID}:${process.env.MAIN_SERVER_TOKEN}`,
    }
})

class TextRoomServer {
    constructor(server, options = {}) {
        this.io = socketio(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            }
        })

        this.limitations = {
            maxMessageLength: 540,
            ...options.limitations,
        }
    }

    connectionPool = []

    roomEventsHandlers = {
        "send:message": (socket, payload) => {
            const { connectedRoom } = socket
            let { message } = payload

            if (message.length > this.limitations.maxMessageLength) {
                message = message.substring(0, this.limitations.maxMessageLength)
            }

            this.io.to(connectedRoom).emit("message", {
                timestamp: payload.timestamp ?? Date.now(),
                content: String(message),
                user: {
                    username: socket.userData.username,
                    fullName: socket.userData.fullName,
                    avatar: socket.userData.avatar,
                },
            })
        }
    }

    initializeSocketIO = () => {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token

                if (!token) {
                    return next(new Error(`auth:token_missing`))
                }

                const session = await mainAPI.post("/session/validate", {
                    session: token
                })
                    .then((res) => {
                        return res.data
                    })
                    .catch((err) => {
                        console.error(`[${socket.id}] failed to validate session caused by server error`, err)

                        return false
                    })

                if (!session) {
                    return next(new Error(`auth:server_error`))
                }

                if (!session.valid) {
                    console.error(`[${socket.id}] failed to validate session caused by invalid token`, session)

                    return next(new Error(`auth:token_invalid`))
                }

                if (!session.user_id) {
                    console.error(`[${socket.id}] failed to validate session caused by invalid session. (missing user_id)`, session)

                    return next(new Error(`auth:invalid_session`))
                }

                const userData = await mainAPI.get(`/user/${session.user_id}/data`)
                    .then((res) => {
                        return res.data
                    })
                    .catch((err) => {
                        console.log(err)
                        return null
                    })

                if (!userData) {
                    return next(new Error(`auth:user_failed`))
                }

                try {
                    // try to decode the token and get the user's username
                    const decodedToken = jwt.decode(token)

                    socket.userData = userData
                    socket.token = token
                    socket.decodedToken = decodedToken
                }
                catch (err) {
                    return next(new Error(`auth:decode_failed`))
                }

                console.log(`[${socket.id}] connected`)

                next()
            } catch (error) {
                next(new Error(`auth:authentification_failed`))
            }
        })

        this.io.on("connection", (socket) => {
            socket.on("join", (...args) => this.handleClientJoin(socket, ...args))

            socket.on("disconnect", () => {
                this.handleClientDisconnect(socket)
            })
        })
    }

    async handleClientJoin(socket, payload, cb) {
        const { room } = payload

        socket.connectedRoom = room

        const pool = await this.attachClientToPool(socket, room).catch((err) => {
            cb(err)
            return null
        })

        if (!pool) return

        console.log(`[${socket.id}] joined room [${room}]`)

        socket.join(room)

        Object.keys(this.roomEventsHandlers).forEach((event) => {
            socket.on(event, (...args) => this.roomEventsHandlers[event](socket, ...args))
        })

        const roomConnections = this.connectionPool.filter((client) => client.room === room).length

        cb(null, {
            roomConnections,
            limitations: this.limitations,
        })
    }

    handleClientDisconnect(socket) {
        const index = this.connectionPool.findIndex((client) => client.id === socket.id)

        if (index === -1) return

        return this.connectionPool.splice(index, 1)
    }

    async attachClientToPool(socket, room) {
        // TODO: check if user can join room or is privated

        if (!room) {
            throw new Error(`room:invalid`)
        }

        return this.connectionPool.push({
            id: socket.id,
            room,
            socket
        })
    }
}

export default class Server {
    constructor(options = {}) {
        this.app = express()
        this.httpServer = http.createServer(this.app)

        this.textRoomServer = new TextRoomServer(this.httpServer)

        this.options = {
            listenHost: process.env.LISTEN_HOST || "0.0.0.0",
            listenPort: process.env.LISTEN_PORT || 3020,
            ...options
        }
    }

    eventBus = global.eventBus = new EventEmitter()

    async __registerInternalMiddlewares() {
        let middlewaresPath = fs.readdirSync(path.resolve(__dirname, "useMiddlewares"))

        for await (const middlewarePath of middlewaresPath) {
            const middleware = require(path.resolve(__dirname, "useMiddlewares", middlewarePath)).default

            if (!middleware) {
                console.error(`Middleware ${middlewarePath} not found.`)

                continue
            }

            this.app.use(middleware)
        }
    }

    async registerBaseRoute() {
        await this.app.get("/", async (req, res) => {
            return res.json({
                uptimeMinutes: Math.floor(process.uptime() / 60),
            })
        })
    }

    registerRoutes() {
        routes.forEach((route) => {
            const order = []

            if (route.middlewares) {
                route.middlewares.forEach((middleware) => {
                    order.push(middleware)
                })
            }

            order.push(route.routes)

            this.app.use(route.use, ...order)
        })
    }

    initialize = async () => {
        const startHrTime = process.hrtime()

        await this.__registerInternalMiddlewares()
        this.app.use(express.json({ extended: false }))
        this.app.use(express.urlencoded({ extended: true }))

        await this.textRoomServer.initializeSocketIO()

        await this.registerBaseRoute()
        await this.registerRoutes()

        await this.httpServer.listen(this.options.listenPort, this.options.listenHost)

        // calculate elapsed time
        const elapsedHrTime = process.hrtime(startHrTime)
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6

        // log server started
        console.log(`🚀 Server started ready on \n\t - http://${this.options.listenHost}:${this.options.listenPort} \n\t - Tooks ${elapsedTimeInMs}ms`)
    }
}