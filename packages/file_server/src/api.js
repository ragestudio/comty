import fs from "fs"
import path from "path"

import RedisClient from "@shared-classes/RedisClient"
import StorageClient from "@shared-classes/StorageClient"
import CacheService from "@shared-classes/CacheService"
import ComtyClient from "@shared-classes/ComtyClient"

import express from "express"
import hyperexpress from "hyper-express"

import pkg from "../package.json"

export default class FileServerAPI {
    // max body length is 1GB in bytes
    static maxBodyLength = 1000 * 1000 * 1000

    // server = global.server = new hyperexpress.Server({
    //     auto_close: true,
    //     fast_buffers: false,
    //     max_body_length: FileServerAPI.maxBodyLength,
    //     streaming: {
    //         highWaterMark: 1000 * 1000 * 1000,
    //         objectMode: false,
    //     }
    // })

    //internalRouter = new hyperexpress.Router()
    internalRouter = express.Router()

    server = global.server = express()

    listenIp = process.env.HTTP_LISTEN_IP ?? "0.0.0.0"
    listenPort = process.env.HTTP_LISTEN_PORT ?? 3060

    redis = global.redis = RedisClient()

    storage = global.storage = StorageClient()

    cache = global.cache = new CacheService()

    comty = global.comty = ComtyClient({
        useWs: false,
    })

    async __loadControllers() {
        let controllersPath = fs.readdirSync(path.resolve(__dirname, "controllers"))

        for await (const controllerPath of controllersPath) {
            const controller = require(path.resolve(__dirname, "controllers", controllerPath)).default

            if (!controller) {
                this.server.InternalConsole.error(`Controller ${controllerPath} not found.`)

                continue
            }

            const handler = await controller(express.Router())

            if (!handler) {
                this.server.InternalConsole.error(`Controller ${controllerPath} returning not valid handler.`)

                continue
            }

            this.internalRouter.use(handler.path ?? "/", handler.router)

            continue
        }
    }

    async __loadMiddlewares() {
        let middlewaresPath = fs.readdirSync(path.resolve(__dirname, "useMiddlewares"))

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
                this.server.InternalConsole.error(`Middleware ${middlewarePath} not found.`)

                continue
            }

            this.server.use(middleware)
        }
    }

    __getRegisteredRoutes() {
        return this.internalRouter.routes.map((route) => {
            return {
                method: route.method,
                path: route.pattern,
            }
        })
    }

    __registerInternalRoutes() {
        this.internalRouter.get("/", (req, res) => {
            return res.status(200).json({
                name: pkg.name,
                version: pkg.version,
            })
        })

        // this.internalRouter.get("/routes", (req, res) => {
        //     return res.status(200).json(this.__getRegisteredRoutes())
        // })

        this.internalRouter.get("*", (req, res) => {
            return res.status(404).json({
                error: "Not found",
            })
        })
    }

    async initialize() {
        const startHrTime = process.hrtime()

        // initialize clients
        await this.redis.initialize()
        await this.storage.initialize()

        this.server.use(express.json({ extended: false }))
        this.server.use(express.urlencoded({ extended: true }))

        // register controllers & middlewares
        await this.__loadControllers()
        await this.__loadMiddlewares()
        await this.__registerInternalRoutes()

        // use internal router
        this.server.use(this.internalRouter)

        // start server
        await this.server.listen(this.listenPort, this.listenIp)

        // calculate elapsed time
        const elapsedHrTime = process.hrtime(startHrTime)
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6

        // log server started
        console.log(`🚀 Server started ready on \n\t - http://${this.listenIp}:${this.listenPort} \n\t - Tooks ${elapsedTimeInMs}ms`)
    }
}