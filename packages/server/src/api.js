import path from "path"
import { Server } from "linebridge/dist/server"

import express from "express"
import bcrypt from "bcrypt"
import passport from "passport"

import jwt from "jsonwebtoken"
import EventEmitter from "@foxify/events"

import { User, Session, Config } from "@models"

import DbManager from "@classes/DbManager"
import { createStorageClientInstance } from "@classes/StorageClient"

import RedisClient from "@shared-classes/RedisClient"

import internalEvents from "./events"

const ExtractJwt = require("passport-jwt").ExtractJwt
const LocalStrategy = require("passport-local").Strategy

global.signLocation = process.env.signLocation

export default class API {
    server = global.server = new Server({
        name: "Main-API",
        minimal: true,
        listen_port: process.env.MAIN_LISTEN_PORT ?? 3000,
        onWSClientConnection: (...args) => {
            this.onWSClientConnection(...args)
        },
        onWSClientDisconnect: (...args) => {
            this.onWSClientDisconnect(...args)
        },
    },
        require("@controllers"),
        require("@middlewares"),
        {
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, X-Requested-With, X-Access-Token, X-Refresh-Token, server_token",
            "Access-Control-Expose-Headers": "regenerated_token",
        },
    )

    redis = global.redis = RedisClient({
        withWsAdapter: true
    })

    DB = new DbManager()

    eventBus = global.eventBus = new EventEmitter()

    storage = global.storage = createStorageClientInstance()

    jwtStrategy = global.jwtStrategy = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.SERVER_TOKEN ?? "secret",
        algorithms: ["sha1", "RS256", "HS256"],
        expiresIn: process.env.signLifetime ?? "1h",
        enforceRegenerationTokenExpiration: false,
    }

    constructor() {
        this.server.engine_instance.use(express.json())
        this.server.engine_instance.use(express.urlencoded({ extended: true }))

        this.server.websocket_instance["clients"] = []
        this.server.websocket_instance["findUserIdFromClientID"] = (searchClientId) => {
            return this.server.websocket_instance.clients.find(client => client.id === searchClientId)?.userId ?? false
        }
        this.server.websocket_instance["getClientSockets"] = (userId) => {
            return this.server.websocket_instance.clients.filter(client => client.userId === userId).map((client) => {
                return client?.socket
            })
        }
        this.server.websocket_instance["broadcast"] = async (channel, ...args) => {
            for await (const client of this.server.websocket_instance.clients) {
                client.socket.emit(channel, ...args)
            }
        }

        global.websocket_instance = this.server.websocket_instance

        global.uploadCachePath = process.env.uploadCachePath ?? path.resolve(process.cwd(), "cache")

        global.DEFAULT_POSTING_POLICY = {
            maxMessageLength: 512,
            acceptedMimeTypes: [
                "application/octet-stream",
                "image/jpg",
                "image/jpeg",
                "image/png",
                "image/gif",
                "audio/mp3",
                "audio/mpeg",
                "audio/ogg",
                "audio/wav",
                "audio/flac",
                "video/mp4",
                "video/mkv",
                "video/webm",
                "video/quicktime",
                "video/x-msvideo",
                "video/x-ms-wmv",
            ],
            maximumFileSize: 80 * 1024 * 1024,
            maximunFilesPerRequest: 20,
        }

        // register internal events
        for (const [eventName, eventHandler] of Object.entries(internalEvents)) {
            this.eventBus.on(eventName, eventHandler)
        }
    }

    events = internalEvents

    async initialize() {
        await this.redis.initialize()
        await this.DB.initialize()
        await this.initializeConfigDB()

        await this.storage.initialize()
        await this.checkSetup()
        await this.initPassport()
        await this.initWebsockets()

        await this.server.initialize()
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

    initPassport() {
        this.server.middlewares["useJwtStrategy"] = (req, res, next) => {
            req.jwtStrategy = this.jwtStrategy
            next()
        }

        passport.use(new LocalStrategy({
            usernameField: "username",
            passwordField: "password",
            session: false
        }, (username, password, done) => {
            // check if username is a email with regex
            let isEmail = username.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

            let query = isEmail ? { email: username } : { username: username }

            User.findOne(query).select("+password")
                .then((data) => {
                    if (data === null) {
                        return done(null, false, this.jwtStrategy)
                    } else if (!bcrypt.compareSync(password, data.password)) {
                        return done(null, false, this.jwtStrategy)
                    }

                    // create a token
                    return done(null, data, this.jwtStrategy, { username, password })
                })
                .catch(err => done(err, null, this.jwtStrategy))
        }))

        this.server.engine_instance.use(passport.initialize())
    }

    initWebsockets() {
        const onAuthenticated = async (socket, userData) => {
            await this.attachClientSocket(socket, userData)

            return socket.emit("authenticated")
        }

        const onAuthenticatedFailed = async (socket, error) => {
            await this.detachClientSocket(socket)

            return socket.emit("authenticateFailed", {
                error,
            })
        }

        if (this.redis.ioAdapter) {
            this.server.websocket_instance.io.adapter(this.redis.ioAdapter)
        }

        this.server.websocket_instance.eventsChannels.push(["/main", "ping", async (socket) => {
            return socket.emit("pong")
        }])

        this.server.websocket_instance.eventsChannels.push(["/main", "authenticate", async (socket, authPayload) => {
            if (!authPayload) {
                return onAuthenticatedFailed(socket, "missing_auth_payload")
            }

            const session = await Session.findOne({ token: authPayload.token }).catch((err) => {
                return false
            })

            if (!session) {
                return onAuthenticatedFailed(socket, "Session not found")
            }

            await jwt.verify(authPayload.token, this.jwtStrategy.secretOrKey, async (err, decoded) => {
                if (err) {
                    return onAuthenticatedFailed(socket, err)
                }

                const userData = await User.findById(decoded.user_id).catch((err) => {
                    return false
                })

                if (!userData) {
                    return onAuthenticatedFailed(socket, "User not found")
                }

                return onAuthenticated(socket, userData)
            })
        }])
    }

    onWSClientConnection = async (socket) => {
        console.log(`🌐 Client connected: ${socket.id}`)
    }

    onWSClientDisconnect = async (socket) => {
        console.log(`🌐 Client disconnected: ${socket.id}`)
        this.detachClientSocket(socket)
    }

    attachClientSocket = async (socket, userData) => {
        const client = this.server.websocket_instance.clients.find(c => c.id === socket.id)

        if (client) {
            client.socket.disconnect()
        }

        const clientObj = {
            id: socket.id,
            socket: socket,
            user_id: userData._id.toString(),
        }

        this.server.websocket_instance.clients.push(clientObj)

        console.log(`📣 Client [${socket.id}] authenticated as ${userData.username}`)

        this.eventBus.emit("user.connected", clientObj.user_id)
    }

    detachClientSocket = async (socket) => {
        const client = this.server.websocket_instance.clients.find(c => c.id === socket.id)

        if (client) {
            this.server.websocket_instance.clients = this.server.websocket_instance.clients.filter(c => c.id !== socket.id)

            console.log(`📣🔴 Client [${socket.id}] authenticated as ${client.user_id} disconnected`)

            this.eventBus.emit("user.disconnected", client.user_id)
        }
    }
}