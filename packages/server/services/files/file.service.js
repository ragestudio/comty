import { Server } from "linebridge/src/server"

import B2 from "backblaze-b2"

import RedisClient from "@shared-classes/RedisClient"
import StorageClient from "@shared-classes/StorageClient"
import CacheService from "@shared-classes/CacheService"

import SharedMiddlewares from "@shared-middlewares"

class API extends Server {
    static refName = "files"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3008

    static maxBodyLength = 1000 * 1000 * 1000

    middlewares = {
        ...SharedMiddlewares
    }

    contexts = {
        cache: new CacheService(),
        redis: RedisClient(),
        storage: StorageClient(),
        b2Storage: new B2({
            applicationKeyId: process.env.B2_KEY_ID,
            applicationKey: process.env.B2_APP_KEY,
        }),
    }

    async onInitialize() {
        await this.contexts.redis.initialize()
        await this.contexts.storage.initialize()
        await this.contexts.b2Storage.authorize()
    }
}

Boot(API)