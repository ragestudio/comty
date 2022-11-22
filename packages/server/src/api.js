import path from "path"
import { Server as LinebridgeServer } from "linebridge/dist/server"
import express from "express"
import bcrypt from "bcrypt"
import passport from "passport"

import jwt from "jsonwebtoken"
import EventEmitter from "@foxify/events"

import { User, Session, Config } from "./models"

import DbManager from "./classes/DbManager"
import { createStorageClientInstance } from "./classes/StorageClient"

import internalEvents from "./events"

const ExtractJwt = require("passport-jwt").ExtractJwt
const LocalStrategy = require("passport-local").Strategy

const controllers = require("./controllers")
const middlewares = require("./middlewares")

global.signLocation = process.env.signLocation

export default class Server {
    DB = new DbManager()

    eventBus = global.eventBus = new EventEmitter()

    storage = global.storage = createStorageClientInstance()

    controllers = [
        controllers.ConfigController,
        controllers.RolesController,
        controllers.FollowerController,
        controllers.SessionController,
        controllers.UserController,
        controllers.FilesController,
        controllers.PublicController,
        controllers.PostsController,
        controllers.StreamingController,
        controllers.BadgesController,
        controllers.CommentsController,
        controllers.SearchController,
        controllers.FeaturedEventsController,
        controllers.PlaylistsController,
        controllers.FeedController,
    ]

    middlewares = middlewares

    server = new LinebridgeServer({
        port: process.env.MAIN_LISTEN_PORT || 3000,
        headers: {
            "Access-Control-Expose-Headers": "regenerated_token",
        },
        onWSClientConnection: (...args) => {
            this.onWSClientConnection(...args)
        },
        onWSClientDisconnect: (...args) => {
            this.onWSClientDisconnect(...args)
        },
    },
        this.controllers,
        this.middlewares
    )

    jwtStrategy = global.jwtStrategy = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: this.server.oskid,
        algorithms: ["sha1", "RS256", "HS256"],
        expiresIn: process.env.signLifetime ?? "1h",
        enforceRegenerationTokenExpiration: false,
    }

    constructor() {
        this.server.engineInstance.use(express.json())
        this.server.engineInstance.use(express.urlencoded({ extended: true }))

        this.server.wsInterface["clients"] = []
        this.server.wsInterface["findUserIdFromClientID"] = (searchClientId) => {
            return this.server.wsInterface.clients.find(client => client.id === searchClientId)?.userId ?? false
        }
        this.server.wsInterface["getClientSockets"] = (userId) => {
            return this.server.wsInterface.clients.filter(client => client.userId === userId).map((client) => {
                return client?.socket
            })
        }
        this.server.wsInterface["broadcast"] = async (channel, ...args) => {
            for await (const client of this.server.wsInterface.clients) {
                client.socket.emit(channel, ...args)
            }
        }

        global.wsInterface = this.server.wsInterface

        global.uploadCachePath = process.env.uploadCachePath ?? path.resolve(process.cwd(), "cache")

        global.DEFAULT_POSTING_POLICY = {
            maxMessageLength: 512,
            acceptedMimeTypes: [
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
        await this.DB.connect()
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

        this.server.engineInstance.use(passport.initialize())
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

        this.server.wsInterface.eventsChannels.push(["/main", "authenticate", async (socket, authPayload) => {
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
        const client = this.server.wsInterface.clients.find(c => c.id === socket.id)

        if (client) {
            client.socket.disconnect()
        }

        const clientObj = {
            id: socket.id,
            socket: socket,
            user_id: userData._id.toString(),
        }

        this.server.wsInterface.clients.push(clientObj)

        console.log(`📣 Client [${socket.id}] authenticated as ${userData.username}`)

        this.eventBus.emit("user.connected", clientObj.user_id)
    }

    detachClientSocket = async (socket) => {
        const client = this.server.wsInterface.clients.find(c => c.id === socket.id)

        if (client) {
            this.server.wsInterface.clients = this.server.wsInterface.clients.filter(c => c.id !== socket.id)

            console.log(`📣🔴 Client [${socket.id}] authenticated as ${client.user_id} disconnected`)

            this.eventBus.emit("user.disconnected", client.user_id)
        }
    }
}