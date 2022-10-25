import path from "path"
import { Server as LinebridgeServer } from "linebridge/dist/server"
import express from "express"
import bcrypt from "bcrypt"
import passport from "passport"

import jwt from "jsonwebtoken"

import { User, Session, Config } from "./models"

import DbManager from "./classes/DbManager"
import { createStorageClientInstance } from "./classes/StorageClient"

const ExtractJwt = require("passport-jwt").ExtractJwt
const LocalStrategy = require("passport-local").Strategy

const controllers = require("./controllers")
const middlewares = require("./middlewares")

export default class Server {
    env = process.env

    storage = global.storage = createStorageClientInstance()
    DB = new DbManager()

    httpListenPort = this.env.listenPort ?? 3000

    controllers = [
        controllers.ConfigController,
        controllers.RolesController,
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
    ]

    middlewares = middlewares

    server = new LinebridgeServer({
        port: this.httpListenPort,
        headers: {
            "Access-Control-Expose-Headers": "regenerated_token",
        },
        onWSClientConnection: this.onWSClientConnection,
        onWSClientDisconnection: this.onWSClientDisconnection,
    }, this.controllers, this.middlewares)

    options = {
        jwtStrategy: {
            sessionLocationSign: this.server.id,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: this.server.oskid,
            algorithms: ["sha1", "RS256", "HS256"],
            expiresIn: this.env.signLifetime ?? "1h",
            enforceRegenerationTokenExpiration: false,
        }
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
        global.httpListenPort = this.listenPort

        global.uploadCachePath = this.env.uploadCachePath ?? path.resolve(process.cwd(), "cache")

        global.jwtStrategy = this.options.jwtStrategy
        global.signLocation = this.env.signLocation

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
    }

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
            req.jwtStrategy = this.options.jwtStrategy
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
                        return done(null, false, this.options.jwtStrategy)
                    } else if (!bcrypt.compareSync(password, data.password)) {
                        return done(null, false, this.options.jwtStrategy)
                    }

                    // create a token
                    return done(null, data, this.options.jwtStrategy, { username, password })
                })
                .catch(err => done(err, null, this.options.jwtStrategy))
        }))

        this.server.engineInstance.use(passport.initialize())
    }

    initWebsockets() {
        this.server.middlewares["useWS"] = (req, res, next) => {
            req.ws = global.wsInterface
            next()
        }

        const onAuthenticated = (socket, user_id) => {
            this.attachClientSocket(socket, user_id)
            socket.emit("authenticated")
        }

        const onAuthenticatedFailed = (socket, error) => {
            this.detachClientSocket(socket)
            socket.emit("authenticateFailed", {
                error,
            })
        }

        this.server.wsInterface.eventsChannels.push(["/main", "authenticate", async (socket, token) => {
            const session = await Session.findOne({ token }).catch(err => {
                return false
            })

            if (!session) {
                return onAuthenticatedFailed(socket, "Session not found")
            }

            this.verifyJwt(token, async (err, decoded) => {
                if (err) {
                    return onAuthenticatedFailed(socket, err)
                } else {
                    const user = await User.findById(decoded.user_id).catch(err => {
                        return false
                    })

                    if (!user) {
                        return onAuthenticatedFailed(socket, "User not found")
                    }

                    return onAuthenticated(socket, user)
                }
            })
        }])
    }

    onWSClientConnection = async (socket) => {
        console.log(`🌐 Client connected: ${socket.id}`)
    }

    onWSClientDisconnection = async (socket) => {
        console.log(`🌐 Client disconnected: ${socket.id}`)
        this.detachClientSocket(socket)
    }

    attachClientSocket = async (client, userData) => {
        const socket = this.server.wsInterface.clients.find(c => c.id === client.id)

        if (socket) {
            socket.socket.disconnect()
        }

        const clientObj = {
            id: client.id,
            socket: client,
            userId: userData._id.toString(),
            user: userData,
        }

        this.server.wsInterface.clients.push(clientObj)

        this.server.wsInterface.io.emit("userConnected", userData)
    }

    detachClientSocket = async (client) => {
        const socket = this.server.wsInterface.clients.find(c => c.id === client.id)

        if (socket) {
            socket.socket.disconnect()
            this.server.wsInterface.clients = this.server.wsInterface.clients.filter(c => c.id !== client.id)
        }

        this.server.wsInterface.io.emit("userDisconnect", client.id)
    }

    verifyJwt = (token, callback) => {
        jwt.verify(token, this.options.jwtStrategy.secretOrKey, async (err, decoded) => {
            if (err) {
                return callback(err)
            }

            return callback(null, decoded)
        })
    }
}