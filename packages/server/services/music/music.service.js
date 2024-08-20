import { Server } from "linebridge/dist/server"

import DbManager from "@shared-classes/DbManager"

import SharedMiddlewares from "@shared-middlewares"
import LimitsClass from "@shared-classes/Limits"

export default class API extends Server {
    static refName = "music"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3003

    middlewares = {
        ...SharedMiddlewares
    }

    contexts = {
        db: new DbManager(),
        limits: {},
    }

    async onInitialize() {
        await this.contexts.db.initialize()

        this.contexts.limits = await LimitsClass.get()
    }
}

Boot(API)