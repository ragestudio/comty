import fs from "fs"
import path from "path"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import StorageClient from "@shared-classes/StorageClient"
import ComtyClient from "@shared-classes/ComtyClient"

import hyperexpress from "hyper-express"

import pkg from "../package.json"

export default class WidgetsAPI {
    static useMiddlewaresOrder = ["useLogger", "useCors", "useAuth"]

    server = global.server = new hyperexpress.Server()

    listenIp = process.env.HTTP_LISTEN_IP ?? "0.0.0.0"
    listenPort = process.env.HTTP_LISTEN_PORT ?? 3040

    internalRouter = new hyperexpress.Router()

    db = new DbManager()

    comty = global.comty = ComtyClient({
        useWs: false,
    })

    redis = global.redis = RedisClient()

    storage = global.storage = StorageClient()

    async __registerControllers() {
        let controllersPath = fs.readdirSync(path.resolve(__dirname, "controllers"))

        for await (const controllerPath of controllersPath) {
            const controller = require(path.resolve(__dirname, "controllers", controllerPath)).default

            if (!controller) {
                console.error(`Controller ${controllerPath} not found.`)

                continue
            }

            const handler = controller(new hyperexpress.Router())

            if (!handler) {
                console.error(`Controller ${controllerPath} returning not valid handler.`)

                continue
            }

            this.internalRouter.use(handler.path ?? "/", handler.router)

            continue
        }
    }

    async __registerInternalMiddlewares() {
        let middlewaresPath = fs.readdirSync(path.resolve(__dirname, "useMiddlewares"))

        // sort middlewares
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

    __getRegisteredRoutes() {
        return this.internalRouter.routes.map((route) => {
            return {
                method: route.method,
                path: route.pattern,
            }
        })
    }

    async initialize() {
        const startHrTime = process.hrtime()

        // initialize clients
        await this.db.initialize()
        await this.redis.initialize()
        await this.storage.initialize()

        // register controllers & middlewares
        await this.__registerInternalRoutes()
        await this.__registerControllers()
        await this.__registerInternalMiddlewares()

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