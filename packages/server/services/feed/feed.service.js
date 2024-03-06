import { Server } from "linebridge/src/server"
import DbManager from "@shared-classes/DbManager"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
    static refName = "feed"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3007

    middlewares = {
        ...SharedMiddlewares
    }

    contexts = {
        db: new DbManager(),
    }

    async onInitialize() {
        await this.contexts.db.initialize()
    }
}

Boot(API)