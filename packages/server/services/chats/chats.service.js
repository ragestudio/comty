import { Server } from "linebridge/dist/server"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import RoomsController from "@classes/RoomsController"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
    static refName = "chats"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static wsRoutesPath = `${__dirname}/routes_ws`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3004

    middlewares = {
        ...SharedMiddlewares
    }

    contexts = {
        db: new DbManager(),
        redis: RedisClient(),
        rooms: null,
    }

    wsEvents = {
        "join:room": (socket, data) => {
            this.contexts.rooms.connectSocketToRoom(socket, data.room)
        },
        "leave:room": (socket, data) => {
            this.contexts.rooms.disconnectSocketFromRoom(socket, data?.room ?? socket.connectedRoom)
        },
        "disconnect": (socket) => {
            try {
                console.log(`[${socket.id}] disconnected from hub.`)

                if (socket.connectedRoomID) {
                    this.contexts.rooms.disconnectSocketFromRoom(socket, socket.connectedRoomID)
                }
            } catch (error) {
                console.error(error)
            }
        }
    }

    async onInitialize() {
        if (!this.engine.ws) {
            throw new Error(`Engine WS not found!`)
        }
        
        this.contexts.rooms = new RoomsController(this.engine.ws.io)
        
        await this.contexts.db.initialize()
        await this.contexts.redis.initialize()
    }

    handleWsAuth = require("@shared-lib/handleWsAuth").default
}

Boot(API)