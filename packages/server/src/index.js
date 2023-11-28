import Boot from "linebridge/bootstrap"
import { Server } from "linebridge/dist/server"

import EventEmitter from "@foxify/events"

import { Config, User } from "@shared-classes/DbModels"
import DbManager from "@shared-classes/DbManager"
import RedisClient from "@shared-classes/RedisClient"
import StorageClient from "@shared-classes/StorageClient"

import Token from "@lib/token"

import internalEvents from "./events"

export default class API extends Server {
    static refName = "MAIN-API"
    static listen_port = process.env.HTTP_LISTEN_PORT || 3010

    static requireWSAuth = true

    constructor(params) {
        super(params)

        global.DEFAULT_POSTING_POLICY = {
            maxMessageLength: 512,
            maximumFileSize: 80 * 1024 * 1024,
            maximunFilesPerRequest: 20,
        }

        global.jwtStrategy = {
            secretOrKey: process.env.JWT_SECRET,
            expiresIn: "1h",
            algorithm: "HS256",
            enforceRegenerationTokenExpiration: false,
        }
    }

    middlewares = require("@middlewares")
    controllers = require("@controllers")

    redis = global.redis = RedisClient({
        withWsAdapter: true
    })

    DB = new DbManager()

    eventBus = new EventEmitter()

    storage = global.storage = StorageClient()

    events = internalEvents

    async onInitialize() {
        for (const [eventName, eventHandler] of Object.entries(internalEvents)) {
            this.eventBus.on(eventName, eventHandler)
        }

        await this.redis.initialize()
        await this.DB.initialize()
        await this.initializeConfigDB()

        await this.storage.initialize()
        await this.checkSetup()
    }

    initializeConfigDB = async () => {
        let serverConfig = await Config.findOne({ key: "server" }).catch(() => {
            return false
        })

        if (!serverConfig) {
            serverConfig = new Config({
                key: "server",
                value: {
                    setup: false,
                },
            })


            await serverConfig.save()
        }
    }

    checkSetup = async () => {
        return new Promise(async (resolve, reject) => {
            let setupOk = (await Config.findOne({ key: "server" })).value?.setup ?? false

            if (!setupOk) {
                console.log("⚠️  Server setup is not complete, running setup proccess.")

                let setupScript = await import("./setup")

                setupScript = setupScript.default ?? setupScript

                try {
                    for await (let script of setupScript) {
                        await script()
                    }

                    console.log("✅  Server setup complete.")

                    await Config.updateOne({ key: "server" }, { value: { setup: true } })

                    return resolve()
                } catch (error) {
                    console.log("❌  Server setup failed.")
                    console.error(error)
                    process.exit(1)
                }
            }

            return resolve()
        })
    }

    handleWsAuth = async (socket, token, err) => {
        try {
            const validation = await Token.validate(token)

            if (!validation.valid) {
                if (validation.error) {
                    return err(`auth:server_error`)
                }

                return err(`auth:token_invalid`)
            }

            const userData = await User.findById(validation.data.user_id).catch((err) => {
                console.error(`[${socket.id}] failed to get user data caused by server error`, err)

                return null
            })

            if (!userData) {
                return err(`auth:user_failed`)
            }

            socket.userData = userData
            socket.token = token
            socket.session = validation.data

            return {
                token: token,
                username: userData.username,
                user_id: userData._id,
            }
        } catch (error) {
            return err(`auth:authentification_failed`, error)
        }
    }
}

Boot(API)