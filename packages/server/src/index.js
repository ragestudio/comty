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
import mongoose from "mongoose"
import passport from "passport"
import { User, Session, Config } from "./models"
import jwt from "jsonwebtoken"

const ExtractJwt = require("passport-jwt").ExtractJwt
const LocalStrategy = require("passport-local").Strategy

function parseConnectionString(obj) {
    const { db_user, db_driver, db_name, db_pwd, db_hostname, db_port } = obj
    return `${db_driver ?? "mongodb"}://${db_user ? `${db_user}` : ""}${db_pwd ? `:${db_pwd}` : ""}${db_user ? "@" : ""}${db_hostname ?? "localhost"}:${db_port ?? ""}/${db_name ?? ""}`
}

class Server {
    constructor() {
        this.env = process.env
        this.listenPort = this.env.listenPort ?? 3000
        this.wsListenPort = this.env.wsListenPort ?? 3001

        this.controllers = require("./controllers").default
        this.middlewares = require("./middlewares")

        this.instance = new LinebridgeServer({
            port: this.listenPort,
            wsPort: this.wsListenPort,
            headers: {
                "Access-Control-Expose-Headers": "regenerated_token",
            },
            onWSClientConnection: this.onWSClientConnection,
            onWSClientDisconnection: this.onWSClientDisconnection,
        }, this.controllers, this.middlewares)

        this.server = this.instance.httpInterface

        this.options = {
            jwtStrategy: {
                sessionLocationSign: this.instance.id,
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: this.instance.oskid,
                algorithms: ["sha1", "RS256", "HS256"],
                expiresIn: this.env.signLifetime ?? "1h",
            }
        }

        this.instance.wsInterface["clients"] = []
        this.instance.wsInterface["findUserIdFromClientID"] = (searchClientId) => {
            return this.instance.wsInterface.clients.find(client => client.id === searchClientId)?.userId ?? false
        }
        this.instance.wsInterface["getClientSockets"] = (userId) => {
            return this.instance.wsInterface.clients.filter(client => client.userId === userId).map((client) => {
                return client?.socket
            })
        }
        this.instance.wsInterface["broadcast"] = async (channel, ...args) => {
            for await (const client of this.instance.wsInterface.clients) {
                client.socket.emit(channel, ...args)
            }
        }

        global.wsInterface = this.instance.wsInterface
        global.httpListenPort = this.listenPort
        global.globalPublicURI = this.env.globalPublicURI
        global.uploadPath = this.env.uploadPath ?? path.resolve(process.cwd(), "uploads")
        global.jwtStrategy = this.options.jwtStrategy
        global.signLocation = this.env.signLocation

        this.initialize()
    }

    async initialize() {
        await this.connectToDB()
        await this.initializeConfigDB()
        await this.checkSetup()
        await this.initPassport()
        await this.initWebsockets()

        await this.instance.initialize()
    }

    connectToDB = () => {
        return new Promise((resolve, reject) => {
            try {
                console.log("🌐 Trying to connect to DB...")
                const dbUri = parseConnectionString(this.env)
                //console.log(dbUri)
                mongoose.connect(dbUri, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                })
                    .then((res) => { return resolve(true) })
                    .catch((err) => { return reject(err) })
            } catch (err) {
                return reject(err)
            }
        }).then(done => {
            console.log(`✅ Connected to DB`)
        }).catch((error) => {
            console.log(`❌ Failed to connect to DB, retrying...\n`)
            console.log(error)
            setTimeout(() => {
                this.connectToDB()
            }, 1000)
        })
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
        this.instance.middlewares["useJwtStrategy"] = (req, res, next) => {
            req.jwtStrategy = this.options.jwtStrategy
            next()
        }
        this.instance.middlewares["useWS"] = (req, res, next) => {
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

        this.server.use(passport.initialize())
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

        this.instance.wsInterface.eventsChannels.push(["/main", "authenticate", async (socket, token) => {
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
        const socket = this.instance.wsInterface.clients.find(c => c.id === client.id)

        if (socket) {
            socket.socket.disconnect()
        }

        const clientObj = {
            id: client.id,
            socket: client,
            userId: userData._id.toString(),
            user: userData,
        }

        this.instance.wsInterface.clients.push(clientObj)

        this.instance.wsInterface.io.emit("userConnected", userData)
    }

    detachClientSocket = async (client) => {
        const socket = this.instance.wsInterface.clients.find(c => c.id === client.id)

        if (socket) {
            socket.socket.disconnect()
            this.instance.wsInterface.clients = this.instance.wsInterface.clients.filter(c => c.id !== client.id)
        }

        this.instance.wsInterface.io.emit("userDisconnect", client.id)
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