import fs from "fs"
import path from "path"

import express from "express"
import http from "http"
import EventEmitter from "@foxify/events"

import ComtyClient from "@shared-classes/ComtyClient"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import StorageClient from "@shared-classes/StorageClient"

import RoomServer from "./roomsServer"

import pkg from "../package.json"

export default class Server {
    static useMiddlewaresOrder = ["useLogger", "useCors", "useAuth", "useErrorHandler"]

    eventBus = global.eventBus = new EventEmitter()

    internalRouter = express.Router()

    constructor(options = {}) {
        this.server = express()
        this._http = http.createServer(this.server)

        this.websocketServer = new RoomServer(this._http)

        this.options = {
            listenHost: process.env.HTTP_LISTEN_IP ?? "0.0.0.0",
            listenPort: process.env.HTTP_LISTEN_PORT ?? 3050,
            ...options
        }
    }

    comty = global.comty = ComtyClient()

    db = new DbManager()

    redis = global.redis = RedisClient({
        withWsAdapter: true
    })

    storage = global.storage = StorageClient()

    async __registerControllers() {
        let controllersPath = fs.readdirSync(path.resolve(__dirname, "controllers"))

        this.internalRouter.routes = []

        for await (const controllerPath of controllersPath) {
            const controller = require(path.resolve(__dirname, "controllers", controllerPath)).default

            if (!controller) {
                console.error(`Controller ${controllerPath} not found.`)

                continue
            }

            const handler = await controller(express.Router())

            if (!handler) {
                console.error(`Controller ${controllerPath} returning not valid handler.`)

                continue
            }

            // let middlewares = []

            // if (Array.isArray(handler.useMiddlewares)) {
            //     middlewares = await getMiddlewares(handler.useMiddlewares)
            // }

            // for (const middleware of middlewares) {
            //     handler.router.use(middleware)
            // }

            this.internalRouter.use(handler.path ?? "/", handler.router)

            this.internalRouter.routes.push({
                path: handler.path ?? "/",
                routers: handler.router.routes
            })

            continue
        }
    }

    async __registerInternalMiddlewares() {
        let middlewaresPath = fs.readdirSync(path.resolve(__dirname, "useMiddlewares"))

        // sort middlewares
        if (this.constructor.useMiddlewaresOrder) {
            middlewaresPath = middlewaresPath.sort((a, b) => {
                const aIndex = this.constructor.useMiddlewaresOrder.indexOf(a.replace(".js", ""))
                const bIndex = this.constructor.useMiddlewaresOrder.indexOf(b.replace(".js", ""))

                if (aIndex === -1) {
                    return 1
                }

                if (bIndex === -1) {
                    return -1
                }

                return aIndex - bIndex
            })
        }

        for await (const middlewarePath of middlewaresPath) {
            const middleware = require(path.resolve(__dirname, "useMiddlewares", middlewarePath)).default

            if (!middleware) {
                console.error(`Middleware ${middlewarePath} not found.`)

                continue
            }

            this.server.use(middleware)
        }
    }

    __registerInternalRoutes() {
        this.internalRouter.get("/", (req, res) => {
            return res.status(200).json({
                name: pkg.name,
                version: pkg.version,
            })
        })

        this.internalRouter.get("/_routes", (req, res) => {
            return res.status(200).json(this.__getRegisteredRoutes(this.internalRouter.routes))
        })

        this.internalRouter.get("*", (req, res) => {
            return res.status(404).json({
                error: "Not found",
            })
        })
    }

    __getRegisteredRoutes(router) {
        return router.map((entry) => {
            if (Array.isArray(entry.routers)) {
                return {
                    path: entry.path,
                    routes: this.__getRegisteredRoutes(entry.routers),
                }
            }

            return {
                method: entry.method,
                path: entry.path,
            }
        })
    }

    initialize = async () => {
        const startHrTime = process.hrtime()

        await this.websocketServer.initialize()

        // initialize clients
        await this.db.initialize()
        await this.redis.initialize()
        await this.storage.initialize()

        // register controllers & middlewares
        this.server.use(express.json({ extended: false }))
        this.server.use(express.urlencoded({ extended: true }))

        await this.__registerControllers()
        await this.__registerInternalMiddlewares()
        await this.__registerInternalRoutes()

        this.server.use(this.internalRouter)

        await this._http.listen(this.options.listenPort, this.options.listenHost)

        // calculate elapsed time
        const elapsedHrTime = process.hrtime(startHrTime)
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6

        // log server started
        console.log(`🚀 Server started ready on \n\t - http://${this.options.listenHost}:${this.options.listenPort} \n\t - Tooks ${elapsedTimeInMs}ms`)
    }
}