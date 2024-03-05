import { Server } from "linebridge/src/server"
import nodemailer from "nodemailer"

export default class API extends Server {
    static refName = "ems"
    static useEngine = "hyper-express"
    static routesPath = `${__dirname}/routes`
    static listen_port = process.env.HTTP_LISTEN_PORT ?? 3007

    contexts = {
        mailTransporter: nodemailer.createTransport({
            host: process.env.SMTP_HOSTNAME,
            port: process.env.SMTP_PORT ?? 587,
            secure: process.env.SMTP_SECURE ?? false,
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
        }),
    }
}

Boot(API)