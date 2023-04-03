import express from "express"
import http from "http"
import cors from "cors"
import morgan from "morgan"
import socketio from "socket.io"
import EventEmitter from "@foxify/events"
import jwt from "jsonwebtoken"
import axios from "axios"

import routes from "./routes"

const mainAPI = axios.create({
    baseURL: process.env.MAIN_API_URL ?? "http://localhost:3010",
    headers: {
        "server_token": `${process.env.MAIN_SERVER_ID}:${process.env.MAIN_SERVER_TOKEN}`,
    }
})

class SpotifyRoom {
    constructor(options = {}) {
        this.options = {
            ...options,
        }

        this.owner_user_id = options.owner_user_id

        this.roomId = options.roomId
    }

    owner = null

    listeners = []

    appendListener = (listener) => {

    }

    initialize = async () => {

    }
}


class RealtimeRoomEventServer {
    constructor(server, options = {}) {
        this.io = socketio(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true,
            }
        })

        this.limitations = {
            ...options.limitations,
        }
    }

    connectionPool = []

    roomEventsHandlers = {
        "owner:update": (socket, payload) => {
            
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
                        console.log(err.response.data)
                        return false
                    })

                if (!session || !session?.valid) {
                    return next(new Error(`auth:token_invalid`))
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
        const { room, type } = payload

        if (!room) {
            return cb(new Error(`room:invalid`))
        }

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
        
        // start spotify ws connection

        const roomConnections = this.connectionPool.filter((client) => client.room === room).length

        return cb(null, {
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

        this.roomServer = new RealtimeRoomEventServer(this.httpServer)

        this.options = {
            listenPort: process.env.PORT || 3030,
            ...options
        }
    }

    eventBus = global.eventBus = new EventEmitter()

    initialize = async () => {
        this.app.use(cors())
        this.app.use(express.json({ extended: false }))
        this.app.use(express.urlencoded({ extended: true }))

        // Use logger if not in production
        if (!process.env.NODE_ENV === "production") {
            this.app.use(morgan("dev"))
        }

        await this.roomServer.initializeSocketIO()

        await this.registerBaseRoute()
        await this.registerRoutes()

        await this.httpServer.listen(this.options.listenPort)

        return {
            listenPort: this.options.listenPort,
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
}