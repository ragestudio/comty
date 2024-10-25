import { Server } from "linebridge"

import DbManager from "@shared-classes/DbManager"

import StartupDB from "./startup_db"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
    static refName = "main"
    static enableWebsockets = true
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT || 3000

    middlewares = {
        ...require("@middlewares").default,
        ...SharedMiddlewares
    }

    events = require("./events")

    contexts = {
        db: new DbManager(),
    }

    async onInitialize() {
        await this.contexts.db.initialize()
        await StartupDB()
    }

    handleWsAuth = require("@shared-lib/handleWsAuth").default
}

Boot(API)