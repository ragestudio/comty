import Server from "linebridge/src/server"

import nodemailer from "nodemailer"
import DbManager from "@shared-classes/DbManager"

import SharedMiddlewares from "@shared-middlewares"

export default class API extends Server {
	static refName = "ems"
	static listenPort = 3007

	static bypassCors = true
	static useMiddlewares = ["logs"]

	middlewares = {
		...SharedMiddlewares,
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
		"account:activation:send": require("./ipcEvents/accountActivation")
			.default,
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
