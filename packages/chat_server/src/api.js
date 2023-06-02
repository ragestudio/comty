import fs from "fs"
import path from "path"

import express from "express"
import http from "http"
import EventEmitter from "@foxify/events"

import ComtyClient from "@shared-classes/ComtyClient"

import routes from "./routes"

import ChatServer from "./chatServer"

export default class Server {
    constructor(options = {}) {
        this.app = express()
        this.httpServer = http.createServer(this.app)

        this.websocketServer = new ChatServer(this.httpServer)

        this.options = {
            listenHost: process.env.HTTP_LISTEN_HOST || "0.0.0.0",
            listenPort: process.env.HTTP_LISTEN_PORT || 3020,
            ...options
        }
    }

    comty = global.comty = ComtyClient()

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

    async registerBaseRoute() {
        await this.app.get("/", async (req, res) => {
            return res.json({
                uptimeMinutes: Math.floor(process.uptime() / 60),
            })
        })
    }

    initialize = async () => {
        const startHrTime = process.hrtime()

        await this.websocketServer.initialize()

        await this.__registerInternalMiddlewares()

        this.app.use(express.json({ extended: false }))
        this.app.use(express.urlencoded({ extended: true }))

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