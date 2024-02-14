require("dotenv").config()

import fs from "node:fs"
import path from "node:path"
import ChildProcess from "node:child_process"
import chalk from "chalk"
import { Observable } from "@gullerya/object-observer"
import hyperexpress from "hyper-express"
import Spinnies from "spinnies"
import { dots as DefaultSpinner } from "spinnies/spinners.json"
import { createProxyMiddleware } from "http-proxy-middleware"
import getInternalIp from "./lib/getInternalIp"

import comtyAscii from "./ascii"
import pkg from "./package.json"

const bootloaderBin = path.resolve(__dirname, "boot")
const servicesPath = path.resolve(__dirname, "services")

async function scanServices() {
    const finalServices = []
    let services = fs.readdirSync(servicesPath)

    for await (let _path of services) {
        _path = path.resolve(servicesPath, _path)

        if (fs.lstatSync(_path).isDirectory()) {
            // search main file "*.service.*" (using regex) on the root of the service path
            const mainFile = fs.readdirSync(_path).find((filename) => {
                const regex = new RegExp(`^.*\.service\..*$`)

                return regex.test(filename)
            })

            if (mainFile) {
                finalServices.push(path.resolve(_path, mainFile))
            }
        }
    }

    return finalServices
}

let internalIp = null
let services = null
let apiWrapper = null
let allReady = false

const spinnies = new Spinnies()

const instancePool = []
const serviceFileReference = {}
const serviceWatcher = Observable.from({})

async function handleProcessExit(error, code) {
    if (error) {
        console.error(error)
    }

    console.log(`\nPreparing to exit...`)

    for await (let instance of instancePool) {
        console.log(`🛑 Killing ${instance.id} [${instance.instance.pid}]`)
        await instance.instance.kill()
    }

    return 0
}

async function handleIPCData(id, data) {
    if (data.type === "log") {
        console.log(`[${id}] ${data.message}`)
    }

    if (data.status === "ready") {
        spinnies.succeed(id, { text: `[${id}] Ready` })
        serviceWatcher[id].ready = true
    }
}

async function handleAllReady() {
    console.log(`🎉 All services[${services.length}] ready!`)

    allReady = true

    // TODO: enable STDIN to control log tabs

    await startAPIProxy()
}

async function startAPIProxy() {
    console.log(`🚀 Starting API proxy...`)

    apiWrapper = new hyperexpress.Server()

    apiWrapper.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        next()
    })

    apiWrapper.get("/", (req, res) => {
        res.send("Hello World!")
    })

    for await (const service of Object.values(serviceWatcher)) {
        if (!service.ready) {
            console.warn(`Skipping proxy for service [${service.id}] due not ready`)
            continue
        }

        if (!service.proxy) {
            console.warn(`Skipping proxy for service [${service.id}]`)
            continue
        }

        if (!service.proxy.path) {
            console.warn(`Skipping proxy for service [${service.id}] due no path`)
            continue
        }

        if (!service.proxy.port) {
            console.warn(`Skipping proxy for service [${service.id}] due no port`)
            continue
        }

        apiWrapper.use(`/${service.proxy.path}`, createProxyMiddleware({
            target: `http://${internalIp}:${service.proxy.port}`,
            changeOrigin: false,
            ws: true,
            pathRewrite: {
                [`^/${service.proxy.path}`]: ""
            }
        }))
    }

    console.log(`🚀 Starting API proxy on port [3000]...`)

    apiWrapper.listen(9000)
}

async function main() {
    internalIp = await getInternalIp()

    console.clear()
    console.log(comtyAscii)
    console.log(`\nRunning ${chalk.bgBlue(`${pkg.name}`)} | ${chalk.bgMagenta(`[v${pkg.version}]`)} | ${internalIp} \n\n\n`)

    services = await scanServices()

    if (services.length === 0) {
        console.error("❌ No service found")
        return process.exit(1)
    }

    Observable.observe(serviceWatcher, (changes) => {
        const { type, path, value } = changes[0]

        switch (type) {
            case "insert": {
                //console.log(`Added new service: ${path}`)
                break
            }
            case "update": {
                //console.log(`Updated service | ${path} > ${value}`)

                //check if all services all ready
                if (Object.values(serviceWatcher).every((service) => service.ready)) {
                    handleAllReady()
                }

                break
            }
        }
    })

    console.log(`📦 Found ${services.length} service(s)`)

    // create watchers
    for await (let service of services) {
        const instanceFile = path.basename(service)
        const instanceBasePath = path.dirname(service)

        const { name: id, version, proxy } = require(path.resolve(instanceBasePath, "package.json"))

        serviceFileReference[instanceFile] = id

        serviceWatcher[id] = {
            id: id,
            version: version,
            file: instanceFile,
            cwd: instanceBasePath,
            proxy: proxy,
            ready: false,
        }

        spinnies.add(id, {
            text: `📦 [${id}] Waiting to load service...`,
            spinner: DefaultSpinner,
        })
    }

    // create a new process of node for each service
    for (let service of services) {
        const { id, version, cwd } = serviceWatcher[serviceFileReference[path.basename(service)]]

        const instance = ChildProcess.fork(bootloaderBin, [service], {
            detached: false,
            silent: true,
            cwd: cwd,
            env: {
                ...process.env
            }
        })

        instancePool.push({
            id,
            version,
            instance
        })

        instance.on("message", (data) => {
            return handleIPCData(id, data)
        })

        // instance.stdout.on("data", (data) => {
        //     console.log(chalk.bgGreen(`[${id}]`), data.toString())
        // })

        // instance.stderr.on("data", (data) => {
        //     console.error(chalk.bgRed(`[${id}]`), data.toString())
        // })

        instance.on('close', (code) => {
            console.log(`[${id}]`, `⏹️ Process exited with code ${code}`);
        })
    }
}

process.on("exit", handleProcessExit)
process.on("SIGINT", handleProcessExit)
process.on("uncaughtException", handleProcessExit)
process.on("unhandledRejection", handleProcessExit)

main()