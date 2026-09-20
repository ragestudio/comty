import { Server } from "linebridge"

import nodemailer from "nodemailer"
import DbManager from "@shared-classes/DbManager"

import SharedMiddlewares from "@shared-middlewares"

import accountActivation from "./ipcEvents/accountActivation.js"
import newLogin from "./ipcEvents/newLogin.js"
import mfaSend from "./ipcEvents/mfaSend.js"
import aprSend from "./ipcEvents/aprSend.js"
import passwordChanged from "./ipcEvents/passwordChanged.js"

export class API extends Server {
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
		"account:activation:send": accountActivation,
		"new:login": newLogin,
		"mfa:send": mfaSend,
		"apr:send": aprSend,
		"password:changed": passwordChanged,
	}

	async onInitialize() {
		await this.contexts.db.initialize()
	}
}

export default API
