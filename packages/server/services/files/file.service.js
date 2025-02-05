import { Server } from "linebridge"

import B2 from "backblaze-b2"

import hePkg from "hyper-express/package.json"

import DbManager from "@shared-classes/DbManager"
import StorageClient from "@shared-classes/StorageClient"
import CacheService from "@shared-classes/CacheService"
import SSEManager from "@shared-classes/SSEManager"
import SharedMiddlewares from "@shared-middlewares"
import LimitsClass from "@shared-classes/Limits"
import TaskQueueManager from "@shared-classes/TaskQueueManager"

class API extends Server {
    static refName = "files"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3002
    static enableWebsockets = true

    middlewares = {
        ...SharedMiddlewares
    }

    contexts = {
        db: new DbManager(),
        cache: new CacheService(),
        storage: StorageClient(),
        b2Storage: null,
        SSEManager: new SSEManager(),
        limits: {},
    }

    queuesManager = new TaskQueueManager({
        workersPath: `${__dirname}/queues`,
    })

    async onInitialize() {
        console.log(`Using HyperExpress v${hePkg.version}`)

        global.sse = this.contexts.SSEManager

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

        await this.queuesManager.initialize({
            redisOptions: this.engine.ws.redis.options
        })
        await this.contexts.db.initialize()
        await this.contexts.storage.initialize()

        global.storage = this.contexts.storage
        global.queues = this.queuesManager

        this.contexts.limits = await LimitsClass.get()
    }
}

Boot(API)