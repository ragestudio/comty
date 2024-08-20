import { Server } from "linebridge/dist/server"
import nodemailer from "nodemailer"
import DbManager from "@shared-classes/DbManager"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
    static refName = "ems"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3007

    middlewares = {
        ...SharedMiddlewares
    }

    contexts = {
        db: new DbManager(),
        mailTransporter: nodemailer.createTransport({
            host: process.env.SMTP_HOSTNAME,
            port: process.env.SMTP_PORT ?? 587,
            secure: ToBoolean(process.env.SMTP_SECURE) ?? false,
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        }),
    }

    ipcEvents = {
        "new:login": require("./ipcEvents/newLogin").default,
        "mfa:send": require("./ipcEvents/mfaSend").default,
        "apr:send": require("./ipcEvents/aprSend").default,
        "password:changed": require("./ipcEvents/passwordChanged").default,
    }

    async onInitialize() {
        await this.contexts.db.initialize()
    }
}

Boot(API)