import { Server } from "linebridge/dist/server"

import DbManager from "@shared-classes/DbManager"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
    static refName = "marketplace"
    static useEngine = "hyper-express"
    static wsRoutesPath = `${__dirname}/ws_routes`
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3005

    middlewares = {
        ...SharedMiddlewares
    }

    contexts = {
        db: new DbManager(),
    }

    async onInitialize() {
        await this.contexts.db.initialize()
    }

    handleWsAuth = require("@shared-lib/handleWsAuth").default
}

Boot(API)