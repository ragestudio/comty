import fs from "fs"
import path from "path"

//import RedisClient from "@classes/RedisClient"
import StorageClient from "@classes/StorageClient"

import hyperexpress from "hyper-express"

import pkg from "../package.json"

export default class FileServerAPI {
    server = global.server = new hyperexpress.Server()

    listenIp = process.env.HTTP_LISTEN_IP ?? "0.0.0.0"
    listenPort = process.env.HTTP_LISTEN_PORT ?? 3006

    internalRouter = new hyperexpress.Router()

    //redis = global.redis = RedisClient()

    storage = global.storage = StorageClient()

    async __loadControllers() {
        let controllersPath = fs.readdirSync(path.resolve(__dirname, "controllers"))

        for await (const controllerPath of controllersPath) {
            const controller = require(path.resolve(__dirname, "controllers", controllerPath)).default

            if (!controller) {
                this.server.InternalConsole.error(`Controller ${controllerPath} not found.`)

                continue
            }

            const handler = controller(new hyperexpress.Router())

            if (!handler) {
                this.server.InternalConsole.error(`Controller ${controllerPath} returning not valid handler.`)

                continue
            }

            this.internalRouter.use(handler.path ?? "/", handler.router)

            continue
        }
    }

    async __loadMiddlewares() {
        let middlewaresPath = fs.readdirSync(path.resolve(__dirname, "middlewares"))

        for await (const middlewarePath of middlewaresPath) {
            const middleware = require(path.resolve(__dirname, "middlewares", middlewarePath)).default

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
        this.server.get("/", (req, res) => {
            return res.status(200).json({
                name: pkg.name,
                version: pkg.version,
                routes: this.__getRegisteredRoutes()
            })
        })

        this.server.any("*", (req, res) => {
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

        // register controllers & middlewares
        await this.__registerInternalRoutes()
        await this.__loadControllers()
        await this.__loadMiddlewares()

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