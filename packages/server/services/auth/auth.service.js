import { Server } from "linebridge"
import DbManager from "@shared-classes/DbManager"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
    static refName = "auth"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3020

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