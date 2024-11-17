import { Server } from "linebridge"
import B2 from "backblaze-b2"

import DbManager from "@shared-classes/DbManager"
import CacheService from "@shared-classes/CacheService"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
    static refName = "marketplace"
    static wsRoutesPath = `${__dirname}/ws_routes`
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3005

    middlewares = {
        ...SharedMiddlewares
    }

    contexts = {
        db: new DbManager(),
        b2: new B2({
            applicationKeyId: process.env.B2_KEY_ID,
            applicationKey: process.env.B2_APP_KEY,
        }),
        cache: new CacheService({
            fsram: false
        }),
    }

    async onInitialize() {
        await this.contexts.db.initialize()
        await this.contexts.b2.authorize()

        global.cache = this.contexts.cache
        global.b2 = this.contexts.b2
    }

    handleWsAuth = require("@shared-lib/handleWsAuth").default
}

Boot(API)