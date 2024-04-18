import { Server } from "linebridge/src/server"

import B2 from "backblaze-b2"

import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import StorageClient from "@shared-classes/StorageClient"
import CacheService from "@shared-classes/CacheService"

import SharedMiddlewares from "@shared-middlewares"
import LimitsClass from "@shared-classes/Limits"

class API extends Server {
    static refName = "files"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3002

    middlewares = {
        ...SharedMiddlewares
    }

    contexts = {
        db: new DbManager(),
        cache: new CacheService(),
        redis: RedisClient(),
        storage: StorageClient(),
        b2Storage: null,
        limits: {},
    }

    async onInitialize() {
        global.storage = this.contexts.storage

        if (process.env.B2_KEY_ID && process.env.B2_APP_KEY) {
            this.contexts.b2Storage = new B2({
                applicationKeyId: process.env.B2_KEY_ID,
                applicationKey: process.env.B2_APP_KEY,
            })

            global.b2Storage = this.contexts.b2Storage

            await this.contexts.b2Storage.authorize()
        } else {
            console.warn("B2 storage not configured on environment, skipping...")
        }

        await this.contexts.db.initialize()
        await this.contexts.redis.initialize()
        await this.contexts.storage.initialize()

        this.contexts.limits = await LimitsClass.get()
    }
}

Boot(API)