require("dotenv").config()

// patches
const { Buffer } = require("buffer")

global.b64Decode = (data) => {
    return Buffer.from(data, "base64").toString("utf-8")
}
global.b64Encode = (data) => {
    return Buffer.from(data, "utf-8").toString("base64")
}

Array.prototype.updateFromObjectKeys = function (obj) {
    this.forEach((value, index) => {
        if (obj[value] !== undefined) {
            this[index] = obj[value]
        }
    })

    return this
}

import path from "path"
import { Server as LinebridgeServer } from "linebridge/dist/server"
import bcrypt from "bcrypt"
import passport from "passport"

import jwt from "jsonwebtoken"

import { User, Session, Config } from "./models"
import DbManager from "./classes/DbManager"

const ExtractJwt = require("passport-jwt").ExtractJwt
const LocalStrategy = require("passport-local").Strategy

class Server {
    env = process.env

    DB = new DbManager()

    httpListenPort = this.env.listenPort ?? 3000
    wsListenPort = this.env.wsListenPort ?? 3001

    controllers = require("./controllers").default
    middlewares = require("./middlewares")

    httpInstance = new LinebridgeServer({
        httpEngine: "express",
        port: this.httpListenPort,
        wsPort: this.wsListenPort,
        headers: {
            "Access-Control-Expose-Headers": "regenerated_token",
        },
        onWSClientConnection: this.onWSClientConnection,
        onWSClientDisconnection: this.onWSClientDisconnection,
    }, this.controllers, this.middlewares)

    options = {
        jwtStrategy: {
            sessionLocationSign: this.httpInstance.id,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: this.httpInstance.oskid,
            algorithms: ["sha1", "RS256", "HS256"],
            expiresIn: this.env.signLifetime ?? "1h",
        }
    }

    constructor() {
        this.httpInstance.wsInterface["clients"] = []
        this.httpInstance.wsInterface["findUserIdFromClientID"] = (searchClientId) => {
            return this.httpInstance.wsInterface.clients.find(client => client.id === searchClientId)?.userId ?? false
        }
        this.httpInstance.wsInterface["getClientSockets"] = (userId) => {
            return this.httpInstance.wsInterface.clients.filter(client => client.userId === userId).map((client) => {
                return client?.socket
            })
        }
        this.httpInstance.wsInterface["broadcast"] = async (channel, ...args) => {
            for await (const client of this.httpInstance.wsInterface.clients) {
                client.socket.emit(channel, ...args)
            }
        }

        global.wsInterface = this.httpInstance.wsInterface
        global.httpListenPort = this.listenPort
        global.globalPublicURI = this.env.globalPublicURI
        global.uploadPath = this.env.uploadPath ?? path.resolve(process.cwd(), "uploads")
        global.jwtStrategy = this.options.jwtStrategy
        global.signLocation = this.env.signLocation

        this.initialize()
    }

    async initialize() {
        await this.DB.connect()
        await this.initializeConfigDB()

        await this.checkSetup()
        await this.initPassport()
        await this.initWebsockets()

        await this.httpInstance.initialize()
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
        this.httpInstance.middlewares["useJwtStrategy"] = (req, res, next) => {
            req.jwtStrategy = this.options.jwtStrategy
            next()
        }
        this.httpInstance.middlewares["useWS"] = (req, res, next) => {
            req.ws = global.wsInterface
            next()
        }

        passport.use(new LocalStrategy({
            usernameField: "username",
            passwordField: "password",
            session: false
        }, (username, password, done) => {
            User.findOne({ username }).select("+password")
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

        this.httpInstance.httpInterface.use(passport.initialize())
    }

    initWebsockets() {
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

        this.httpInstance.wsInterface.eventsChannels.push(["/main", "authenticate", async (socket, token) => {
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
        const socket = this.httpInstance.wsInterface.clients.find(c => c.id === client.id)

        if (socket) {
            socket.socket.disconnect()
        }

        const clientObj = {
            id: client.id,
            socket: client,
            userId: userData._id.toString(),
            user: userData,
        }

        this.httpInstance.wsInterface.clients.push(clientObj)

        this.httpInstance.wsInterface.io.emit("userConnected", userData)
    }

    detachClientSocket = async (client) => {
        const socket = this.httpInstance.wsInterface.clients.find(c => c.id === client.id)

        if (socket) {
            socket.socket.disconnect()
            this.httpInstance.wsInterface.clients = this.httpInstance.wsInterface.clients.filter(c => c.id !== client.id)
        }

        this.httpInstance.wsInterface.io.emit("userDisconnect", client.id)
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

new Server()