import { Server } from "linebridge/src/server"

import DbManager from "@shared-classes/DbManager"

export default class API extends Server {
    static refName = "posts"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3001

    contexts = {
        db: new DbManager(),
    }

    events = {

    }

    async onInitialize() {
        await this.contexts.db.initialize()
    }
}

Boot(API)