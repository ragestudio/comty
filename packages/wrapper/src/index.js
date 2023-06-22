require("./globals")

const pm2 = require("pm2")

const fs = require("fs")
const path = require("path")
const express = require("express")
const cors = require("cors")
const chalk = require("chalk")
const { exec, spawn, fork } = require("child_process")

const getInternalIp = require("./lib/getInternalIp")
const comtyAscii = require("./ascii")

const useLogger = require("./lib/useLogger")
const { createProxyMiddleware } = require("http-proxy-middleware")

const { setupLatestRelease } = require("./lib/setupDist")

const developmentServers = [
    {
        name: "WebAPP",
        color: "bgRed",
        cwd: path.resolve(global.__root, "../../app"),
    },
    {
        name: "MainAPI",
        color: "bgBlue",
        cwd: path.resolve(global.__root, "../../server"),
    },
    {
        name: "ChatAPI",
        color: "bgMagenta",
        cwd: path.resolve(global.__root, "../../chat_server"),
    },
    {
        name: "MarketplaceAPI",
        color: "bgCyan",
        cwd: path.resolve(global.__root, "../../marketplace_server"),
    },
    {
        name: "MusicAPI",
        color: "bgGreen",
        cwd: path.resolve(global.__root, "../../music_server")
    },
    {
        name: "FileAPI",
        color: "bgYellow",
        cwd: path.resolve(global.__root, "../../file_server"),
    },
]

const ApiServers = [
    {
        name: "default",
        remote: ({
            address,
            protocol,
            port
        } = {}) => `${protocol ?? "http"}://${address ?? process.env.LOCALHOST}:${port ?? 3010}`,
    },
    {
        name: "chat",
        remote: ({
            address,
            protocol,
            port
        } = {}) => `${protocol ?? "http"}://${address ?? process.env.LOCALHOST}:${port ?? 3020}`,
    },
    {
        name: "livestreaming",
        remote: ({
            address,
            protocol,
            port
        } = {}) => `${protocol ?? "http"}://${address ?? process.env.LOCALHOST}:${port ?? 3030}`,
    },
    {
        name: "marketplace",
        remote: ({
            address,
            protocol,
            port
        } = {}) => `${protocol ?? "http"}://${address ?? process.env.LOCALHOST}:${port ?? 3040}`
    },
    {
        name: "music",
        remote: ({
            address,
            protocol,
            port
        } = {}) => `${protocol ?? "http"}://${address ?? process.env.LOCALHOST}:${port ?? 3050}`
    },
    {
        name: "files",
        remote: ({
            address,
            protocol,
            port
        } = {}) => `${protocol ?? "http"}://${address ?? process.env.LOCALHOST}:${port ?? 3060}`
    }
]

class Main {
    static checkDistIntegrity() {
        // check if dist folder exists
        if (!fs.existsSync(global.distPath)) {
            return false
        }

        // TODO: check the dist checksum with oficial server checksum

        return true
    }

    static fetchDistManifest() {
        if (!fs.existsSync(global.distPath)) {
            return null
        }

        const pkgPath = path.join(global.distPath, "manifest.json")

        if (!fs.existsSync(pkgPath)) {
            return null
        }

        const pkg = require(pkgPath)

        return pkg
    }

    constructor(process) {
        this.process = process
        this.args = this.getArgs()

        this.registerExitHandlers()
        this.initialize()
    }

    initialize = async () => {
        console.clear()
        console.log(comtyAscii)
        console.log(`${chalk.bgBlue(`Running Wrapper`)} ${chalk.bgMagenta(`[v${global.packagejson.version}]`)}`)

        this.internalIp = await getInternalIp()

        this.webapp_port = this.args.web_port ?? 9000
        this.api_port = this.args.api_proxy_port ?? 5000

        if (this.args.dev === true) {
            console.log(`🔧  Running in ${chalk.bgYellow("DEVELOPMENT")} mode \n\n`)

            //this.runDevelopmentServers()
            this.runDevelopmentScript()
            this.initializeAPIProxyServer()

            return this
        } else {
            if (!Main.checkDistIntegrity()) {
                await setupLatestRelease()
            }
        }

        this.initializeWebAppServer()
        this.initializeAPIProxyServer()

        return this
    }

    runDevelopmentScript = async () => {
        const devScript = spawn("npm", ["run", "dev"], {
            cwd: path.resolve(global.__root, "../../../"),
            shell: true,
            stdio: "inherit"
        })

        // devScript.stdout.on("data", (data) => {
        //     console.log(`${chalk.bgYellow("[WebAPP]")} ${data.toString()}`)
        // })

        devScript.on("exit", (code) => {
            console.log(`🔧  ${chalk.bgYellow("WebAPP")} exited with code ${code}`)
        })
    }

    runDevelopmentServers = async () => {
        this.dev_servers = []

        // start all development servers
        for (let i = 0; i < developmentServers.length; i++) {
            const server = developmentServers[i]

            console.log(`🔧  Starting ${chalk.bgYellow(server.name)}...`)

            const serverProcess = spawn("npm", ["run", "dev"], {
                cwd: server.cwd,
                shell: true
            })

            let chalkInstance = chalk[server.color]

            if (typeof chalkInstance === undefined) {
                chalkInstance = chalk.bgWhite
            }

            // log output of server
            serverProcess.stdout.on("data", (data) => {
                console.log(`${chalkInstance(`[${server.name}]`)} ${data.toString()}`)
            })

            serverProcess.on("exit", (code) => {
                console.log(`🔧  ${chalk.bgYellow(server.name)} exited with code ${code}`)
            })

            this.dev_servers.push({
                name: server.name,
                process: serverProcess
            })
        }
    }

    registerExitHandlers() {
        this.process.on("exit", this.onExit)
        this.process.on("SIGINT", this.onExit)
        this.process.on("SIGUSR1", this.onExit)
        this.process.on("SIGUSR2", this.onExit)
        this.process.on("uncaughtException", this.onExit)
    }

    onExit = async () => {
        console.clear()
        console.log(comtyAscii)
        console.log(`Closing wrapper... \n\n`)

        setTimeout(() => {
            console.log(`Wrapper did not close in time, forcefully closing...`)
            process.exit(0)
        }, 5000)

        if (Array.isArray(this.dev_servers)) {
            for await (const server of this.dev_servers) {
                console.log(`Killing ${chalk.bgYellow(server.name)}...`)

                server.process.kill()
            }
        }

        return process.exit(0)
    }

    getArgs = () => {
        let args = {}

        for (let i = 0; i < this.process.argv.length; i++) {
            const arg = this.process.argv[i]

            if (arg.startsWith("--")) {
                const argName = arg.replace("--", "")
                const argValue = this.process.argv[i + 1]

                args[argName] = argValue ?? true
            }
        }

        return args
    }

    initializeWebAppServer = async () => {
        this.webapp_server = express()

        this.webapp_server.use(cors({
            origin: "*",
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
            preflightContinue: true,
            optionsSuccessStatus: 204
        }))

        if (!this.forwardAppPort) {
            this.webapp_server.use(express.static(global.distPath))

            this.webapp_server.get("*", (req, res) => {
                return res.sendFile(path.join(global.distPath, "index.html"))
            })
        } else {
            this.webapp_server.use(createProxyMiddleware({
                target: `http://${this.internalIp}:${this.forwardAppPort}`,
                changeOrigin: true,
                ws: true,
                pathRewrite: {
                    "^/": ""
                }
            }))
        }

        this.webapp_server.listen(this.webapp_port)

        console.log(`🌐  WEB-APP Listening on > `, `${this.internalIp}:${this.webapp_port}`)

        return this.webapp_server
    }

    initializeAPIProxyServer = async () => {
        this.apiproxy_server = express()

        this.apiproxy_server.use(useLogger)

        ApiServers.forEach((server) => {
            const remote = server.remote({
                address: "eu02.ragestudio.net", //this.internalIp,
                protocol: this.forceApiHttps ? "https" : "http",
            })

            this.apiproxy_server.use(`/${server.name}`, createProxyMiddleware({
                target: `${remote}`,
                changeOrigin: true,
                ws: true,
                pathRewrite: {
                    [`^/${server.name}`]: ""
                }
            }))
        })

        this.apiproxy_server.listen(this.api_port)

        console.log(`🌐  API-PROXY Listening on >`, `${this.internalIp}:${this.api_port}`)

        return this.apiproxy_server
    }
}

new Main(process)