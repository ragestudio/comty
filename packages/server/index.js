require("dotenv").config()

import fs from "node:fs"
import path from "node:path"
import repl from "node:repl"
import { Transform } from "node:stream"
import ChildProcess from "node:child_process"
import { Observable } from "@gullerya/object-observer"
import chalk from "chalk"
import Spinnies from "spinnies"
import chokidar from "chokidar"
import IPCRouter from "linebridge/src/server/classes/IPCRouter"
import fastify from "fastify"
import { createProxyMiddleware } from "http-proxy-middleware"

import { dots as DefaultSpinner } from "spinnies/spinners.json"
import getInternalIp from "./lib/getInternalIp"
import comtyAscii from "./ascii"
import pkg from "./package.json"

import cors from "linebridge/src/server/middlewares/cors"

import { onExit } from "signal-exit"


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

let internal_proxy = null
let allReady = false
let selectedProcessInstance = null
let internalIp = null
let services = null

const spinnies = new Spinnies()

const ipcRouter = global.ipcRouter = new IPCRouter()
const instancePool = global.instancePool = []
const serviceFileReference = {}
const serviceRegistry = global.serviceRegistry = Observable.from({})

Observable.observe(serviceRegistry, (changes) => {
    const { type, path, value } = changes[0]

    switch (type) {
        case "update": {
            //console.log(`Updated service | ${path} > ${value}`)

            //check if all services all ready
            if (Object.values(serviceRegistry).every((service) => service.ready)) {
                handleAllReady()
            }

            break
        }
    }
})

function detachInstanceStd(instance) {
    if (instance.logs) {
        instance.logs.stdout.unpipe(process.stdout)
        instance.logs.stderr.unpipe(process.stderr)
    }
}

function attachInstanceStd(instance, { afterMsg } = {}) {
    if (instance.logs) {
        console.clear()

        if (afterMsg) {
            console.log(afterMsg)
        }

        instance.logs.stdout.pipe(process.stdout)
        instance.logs.stderr.pipe(process.stderr)
    }
}

const relp_commands = [
    {
        cmd: "select",
        aliases: ["s", "sel"],
        fn: (cb, service) => {
            if (!isNaN(parseInt(service))) {
                service = serviceRegistry[Object.keys(serviceRegistry)[service]]
            } else {
                service = serviceRegistry[service]
            }

            if (!service) {
                console.error(`Service [${service}] not found`)
                return false
            }

            if (selectedProcessInstance) {
                detachInstanceStd(selectedProcessInstance.instance)
                selectedProcessInstance = null
            }

            selectedProcessInstance = instancePool.find((instance) => instance.id === service.id)

            if (!selectedProcessInstance) {
                selectedProcessInstance = null

                console.error(`Cannot find service [${service.id}] in the instances pool`)

                return false
            }

            attachInstanceStd(selectedProcessInstance.instance)

            return true
        }
    }
]

async function getIgnoredFiles(cwd) {
    // git check-ignore -- *
    let output = await new Promise((resolve, reject) => {
        ChildProcess.exec("git check-ignore -- *", {
            cwd: cwd
        }, (err, stdout) => {
            if (err) {
                resolve(``)
            }

            resolve(stdout)
        })
    })

    output = output.split("\n").map((file) => {
        return `**/${file.trim()}`
    })

    output = output.filter((file) => {
        return file
    })

    return output
}

async function handleAllReady() {
    if (allReady) {
        return false
    }

    console.clear()

    allReady = true

    console.log(comtyAscii)
    console.log(`🎉 All services[${services.length}] ready!\n`)
    console.log(`USE: select <service>, reboot, exit`)
}

// SERVICE WATCHER FUNCTIONS
async function handleNewServiceStarting(id) {
    if (serviceRegistry[id].ready === false) {
        spinnies.add(id, {
            text: `📦 [${id}] Loading service...`,
            spinner: DefaultSpinner
        })
    }
}

async function handleServiceStarted(id) {
    if (serviceRegistry[id].ready === false) {
        if (spinnies.pick(id)) {
            spinnies.succeed(id, { text: `[${id}][${serviceRegistry[id].index}] Ready` })
        }
    }

    serviceRegistry[id].ready = true
}

async function handleServiceExit(id, code, err) {
    //console.log(`🛑 Service ${id} exited with code ${code}`, err)

    if (serviceRegistry[id].ready === false) {
        if (spinnies.pick(id)) {
            spinnies.fail(id, { text: `[${id}][${serviceRegistry[id].index}] Failed with code ${code}` })
        }
    }

    serviceRegistry[id].ready = false
}

async function registerProxy(_path, target, pathRewrite) {
    if (internal_proxy.proxys.has(_path)) {
        console.warn(`Proxy already registered [${_path}], skipping...`)
        return false
    }

    console.log(`🔗 Registering path proxy [${_path}] -> [${target}]`)

    internal_proxy.proxys.add(_path)

    internal_proxy.use(_path, createProxyMiddleware({
        target: target,
        changeOrigin: true,
        pathRewrite: pathRewrite,
        ws: true,
        logLevel: "silent",
    }))

    return true
}

async function handleIPCData(service_id, msg) {
    if (msg.type === "log") {
        console.log(`[${service_id}] ${msg.message}`)
    }

    if (msg.status === "ready") {
        await handleServiceStarted(service_id)
    }

    if (msg.type === "router:register") {
        if (msg.data.path_overrides) {
            for await (let pathOverride of msg.data.path_overrides) {
                await registerProxy(
                    `/${pathOverride}`,
                    `http://${internalIp}:${msg.data.listen.port}/${pathOverride}`,
                    {
                        [`^/${pathOverride}`]: "",
                    }
                )
            }
        } else {
            await registerProxy(
                `/${service_id}`,
                `http://${msg.data.listen.ip}:${msg.data.listen.port}`
            )
        }
    }
}

function spawnService({ id, service, cwd }) {
    handleNewServiceStarting(id)

    const instanceEnv = {
        ...process.env,
        lb_service: {
            id: service.id,
            index: service.index,
        },
    }

    let instance = ChildProcess.fork(bootloaderBin, [service], {
        detached: false,
        silent: true,
        cwd: cwd,
        env: instanceEnv,
    })

    instance.reload = () => {
        ipcRouter.unregister({ id, instance })

        instance.kill()

        instance = spawnService({ id, service, cwd })

        const instanceIndex = instancePool.findIndex((_instance) => _instance.id === id)

        if (instanceIndex !== -1) {
            instancePool[instanceIndex].instance = instance
        }

        // check if selectedProcessInstance
        if (selectedProcessInstance) {
            detachInstanceStd(selectedProcessInstance.instance)

            //if the selected process is this service, reattach std
            if (selectedProcessInstance.id === id) {
                attachInstanceStd(instance, {
                    afterMsg: "Reloading service...",
                })
            }
        }
    }

    instance.logs = {
        stdout: createServiceLogTransformer({ id }),
        stderr: createServiceLogTransformer({ id, color: "bgRed" }),
    }

    instance.logs.stdout.history = []
    instance.logs.stderr.history = []

    // push to buffer history
    instance.stdout.pipe(instance.logs.stdout)
    instance.stderr.pipe(instance.logs.stderr)

    instance.on("message", (data) => {
        return handleIPCData(id, data)
    })

    instance.on("close", (code, err) => {
        return handleServiceExit(id, code, err)
    })

    ipcRouter.register({ id, instance })

    return instance
}

function createServiceLogTransformer({ id, color = "bgCyan" }) {
    return new Transform({
        transform(data, encoding, callback) {
            callback(null, `${chalk[color](`[${id}]`)} > ${data.toString()}`)
        }
    })
}

async function main() {
    internalIp = await getInternalIp()

    internal_proxy = fastify()

    internal_proxy.proxys = new Set()

    await internal_proxy.register(require("@fastify/middie"))

    await internal_proxy.use(cors)

    internal_proxy.get("/ping", (request, reply) => {
        return reply.send({
            status: "ok"
        })
    })

    internal_proxy.get("/", (request, reply) => {
        return reply.send({
            services: instancePool.map((instance) => {
                return {
                    id: instance.id,
                    version: instance.version,
                }
            }),
        })
    })

    console.clear()
    console.log(comtyAscii)
    console.log(`\nRunning ${chalk.bgBlue(`${pkg.name}`)} | ${chalk.bgMagenta(`[v${pkg.version}]`)} | ${internalIp} \n\n\n`)

    services = await scanServices()

    if (services.length === 0) {
        console.error("❌ No service found")
        return process.exit(1)
    }

    console.log(`📦 Found ${services.length} service(s)`)

    // create watchers
    for await (let service of services) {
        const instanceFile = path.basename(service)
        const instanceBasePath = path.dirname(service)

        const { name: id, version } = require(path.resolve(instanceBasePath, "package.json"))

        serviceFileReference[instanceFile] = id

        serviceRegistry[id] = {
            index: services.indexOf(service),
            id: id,
            version: version,
            file: instanceFile,
            cwd: instanceBasePath,
            buffer: [],
            ready: false,
        }
    }

    // create a new process of node for each service
    for await (let service of services) {
        const { id, version, cwd } = serviceRegistry[serviceFileReference[path.basename(service)]]

        const instance = spawnService({ id, service, cwd })

        const serviceInstance = {
            id,
            version,
            instance
        }

        // push to pool
        instancePool.push(serviceInstance)

        // if is NODE_ENV to development, start a file watcher for hot-reload
        if (process.env.NODE_ENV === "development") {
            const ignored = [
                ...await getIgnoredFiles(cwd),
                "**/node_modules/**",
                "**/dist/**",
                "**/build/**",
            ]

            chokidar.watch(cwd, {
                ignored: ignored,
                persistent: true,
                ignoreInitial: true,
            }).on("all", (event, path) => {
                // find instance from pool
                const instanceIndex = instancePool.findIndex((instance) => instance.id === id)

                console.log(event, path, instanceIndex)

                // reload
                instancePool[instanceIndex].instance.reload()
            })
        }
    }

    // create repl 
    repl.start({
        prompt: "> ",
        useGlobal: true,
        eval: (input, context, filename, callback) => {
            let inputs = input.split(" ")

            // remove last \n from input
            inputs[inputs.length - 1] = inputs[inputs.length - 1].replace(/\n/g, "")

            // find relp command 
            const command = inputs[0]
            const args = inputs.slice(1)

            const command_fn = relp_commands.find((relp_command) => {
                let exising = false

                if (Array.isArray(relp_command.aliases)) {
                    exising = relp_command.aliases.includes(command)
                }

                if (relp_command.cmd === command) {
                    exising = true
                }

                return exising
            })

            if (!command_fn) {
                return callback(`Command not found: ${command}`)
            }

            return command_fn.fn(callback, ...args)
        }
    })

    await internal_proxy.listen({
        host: "0.0.0.0",
        port: 9000
    })

    onExit((code, signal) => {
        console.clear()
        console.log(`\n🛑 Preparing to exit...`)

        console.log(`Stoping proxy...`)

        internal_proxy.close()

        console.log(`Kill all ${instancePool.length} instances...`)

        for (let instance of instancePool) {
            console.log(`Killing ${instance.id} [${instance.instance.pid}]`)

            instance.instance.kill()
        }
    })
}

main()