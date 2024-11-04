require("dotenv").config()

import path from "node:path"
import Spinnies from "spinnies"
import { Observable } from "@gullerya/object-observer"
import { dots as DefaultSpinner } from "spinnies/spinners.json"
import EventEmitter from "@foxify/events"
import IPCRouter from "linebridge/dist/classes/IPCRouter"
import chokidar from "chokidar"
import { onExit } from "signal-exit"
import chalk from "chalk"
import treeKill from "tree-kill"

import getIgnoredFiles from "./utils/getIgnoredFiles"
import scanServices from "./utils/scanServices"
import spawnService from "./utils/spawnService"

import Proxy from "./proxy"
import RELP from "./repl"

import comtyAscii from "./ascii"
import pkg from "../package.json"

const useLoadSpinner = process.argv.includes("--load-spinner")

export default class Gateway {
    spinnies = new Spinnies()
    eventBus = new EventEmitter()

    state = {
        proxyPort: 9000,
        internalIp: "0.0.0.0",
        allReady: false
    }

    selectedProcessInstance = null

    instancePool = []
    services = []
    serviceRegistry = Observable.from({})
    serviceFileReference = {}

    proxy = null
    ipcRouter = null

    async createServicesWatchers() {
        for await (let service of this.services) {
            const instanceFile = path.basename(service)
            const instanceBasePath = path.dirname(service)

            const servicePkg = require(path.resolve(instanceBasePath, "package.json"))

            this.serviceFileReference[instanceFile] = servicePkg.name

            this.serviceRegistry[servicePkg.name] = {
                index: this.services.indexOf(service),
                id: servicePkg.name,
                version: servicePkg.version,
                file: instanceFile,
                cwd: instanceBasePath,
                buffer: [],
                ready: false,
            }
        }
    }

    async createServicesProcess() {
        for await (let service of this.services) {
            const { id, version, cwd } = this.serviceRegistry[this.serviceFileReference[path.basename(service)]]

            this.serviceHandlers.onStarting(id)

            const instance = await spawnService({
                id,
                service,
                cwd,
                onReload: this.serviceHandlers.onReload,
                onClose: this.serviceHandlers.onClose,
                onError: this.serviceHandlers.onError,
                onIPCData: this.serviceHandlers.onIPCData,
            })

            if (!useLoadSpinner) {
                instance.logs.attach()
            }

            const serviceInstance = {
                id,
                version,
                instance
            }

            // push to pool
            this.instancePool.push(serviceInstance)

            // if is NODE_ENV to development, start a file watcher for hot-reload
            if (process.env.NODE_ENV === "development") {
                const ignored = [
                    ...await getIgnoredFiles(cwd),
                    "**/.cache/**",
                    "**/node_modules/**",
                    "**/dist/**",
                    "**/build/**",
                ]

                const watcher = chokidar.watch(cwd, {
                    ignored: ignored,
                    persistent: true,
                    ignoreInitial: true,
                })

                watcher.on("all", (event, path) => {
                    // find instance from pool
                    const instanceIndex = this.instancePool.findIndex((instance) => instance.id === id)

                    console.log(event, path, instanceIndex)

                    // reload
                    this.instancePool[instanceIndex].instance.reload()
                })
            }
        }
    }

    serviceHandlers = {
        onStarting: (id) => {
            if (this.serviceRegistry[id].ready === false) {
                if (useLoadSpinner) {
                    this.spinnies.add(id, {
                        text: `📦 [${id}] Loading service...`,
                        spinner: DefaultSpinner
                    })
                }
            }
        },
        onStarted: (id) => {
            this.serviceRegistry[id].initialized = true

            if (this.serviceRegistry[id].ready === false) {
                if (useLoadSpinner) {
                    if (this.spinnies.pick(id)) {
                        this.spinnies.succeed(id, { text: `[${id}][${this.serviceRegistry[id].index}] Ready` })
                    }
                }
            }

            this.serviceRegistry[id].ready = true
        },
        onIPCData: async (id, msg) => {
            if (msg.type === "log") {
                console.log(`[${id}] ${msg.message}`)
            }

            if (msg.status === "ready") {
                await this.serviceHandlers.onStarted(id)
            }

            if (msg.type === "router:register") {
                if (msg.data.path_overrides) {
                    for await (let pathOverride of msg.data.path_overrides) {
                        await this.proxy.register({
                            serviceId: id,
                            path: `/${pathOverride}`,
                            target: `http://${this.state.internalIp}:${msg.data.listen.port}/${pathOverride}`,
                            pathRewrite: {
                                [`^/${pathOverride}`]: "",
                            },
                        })
                    }
                } else {
                    await this.proxy.register({
                        serviceId: id,
                        path: `/${id}`,
                        target: `http://${msg.data.listen.ip}:${msg.data.listen.port}`,
                    })
                }
            }

            if (msg.type === "router:ws:register") {
                await this.proxy.register({
                    serviceId: id,
                    path: `/${msg.data.namespace}`,
                    target: `http://${this.state.internalIp}:${msg.data.listen.port}/${msg.data.namespace}`,
                    pathRewrite: {
                        [`^/${msg.data.namespace}`]: "",
                    },
                    ws: true,
                })
            }
        },
        onReload: async ({ id, service, cwd, }) => {
            console.log(`[onReload] ${id} ${service}`)

            let instance = this.instancePool.find((instance) => instance.id === id)

            if (!instance) {
                console.error(`❌ Service ${id} not found`)
                return false
            }

            // if (this.selectedProcessInstance) {
            //     if (this.selectedProcessInstance === "all") {
            //         this.std.detachAllServicesSTD()
            //     } else if (this.selectedProcessInstance.id === id) {
            //         this.selectedProcessInstance.instance.logs.detach()
            //     }
            // }

            this.ipcRouter.unregister({ id, instance })

            // try to unregister from proxy
            this.proxy.unregisterAllFromService(id)

            await instance.instance.kill("SIGINT")

            instance.instance = await spawnService({
                id,
                service,
                cwd,
                onReload: this.serviceHandlers.onReload,
                onClose: this.serviceHandlers.onClose,
                onError: this.serviceHandlers.onError,
                onIPCData: this.serviceHandlers.onIPCData,
            })

            const instanceIndex = this.instancePool.findIndex((_instance) => _instance.id === id)

            if (instanceIndex !== -1) {
                this.instancePool[instanceIndex] = instance
            }

            if (this.selectedProcessInstance) {
                if (this.selectedProcessInstance === "all") {
                    this.std.attachAllServicesSTD()
                } else if (this.selectedProcessInstance.id === id) {
                    this.std.attachServiceSTD(id)
                }
            }
        },
        onClose: (id, code, err) => {
            this.serviceRegistry[id].initialized = true

            if (this.serviceRegistry[id].ready === false) {
                if (this.spinnies.pick(id)) {
                    this.spinnies.fail(id, { text: `[${id}][${this.serviceRegistry[id].index}] Failed with code ${code}` })
                }
            }

            console.log(`[${id}] Exit with code ${code}`)

            if (err) {
                console.error(err)
            }

            // try to unregister from proxy
            this.proxy.unregisterAllFromService(id)

            this.serviceRegistry[id].ready = false
        },
        onError: (id, err) => {
            console.error(`[${id}] Error`, err)
        },
    }

    onAllServicesReload = (id) => {
        for (let instance of this.instancePool) {
            instance.instance.reload()
        }
    }

    onAllServicesReady = async () => {
        if (this.state.allReady) {
            return false
        }

        console.clear()

        this.state.allReady = true

        console.log(comtyAscii)
        console.log(`🎉 All services[${this.services.length}] ready!\n`)
        console.log(`USE: select <service>, reload, exit`)

        await this.proxy.listen(this.state.proxyPort, this.state.internalIp)

        if (useLoadSpinner) {
            if (!this.selectedProcessInstance) {
                this.std.detachAllServicesSTD()
                this.std.attachAllServicesSTD()
            }
        }
    }

    onGatewayExit = (code, signal) => {
        console.clear()
        console.log(`\n🛑 Preparing to exit...`)

        console.log(`Stoping proxy...`)

        this.proxy.close()

        console.log(`Kill all ${this.instancePool.length} instances...`)

        for (let instance of this.instancePool) {
            console.log(`Killing ${instance.id} [${instance.instance.pid}]`)

            instance.instance.kill()

            treeKill(instance.instance.pid)
        }

        treeKill(process.pid)
    }

    std = {
        reloadService: () => {
            if (!this.selectedProcessInstance) {
                console.error(`No service selected`)
                return false
            }

            if (this.selectedProcessInstance === "all") {
                return this.onAllServicesReload()
            }

            return this.selectedProcessInstance.instance.reload()
        },
        findServiceById: (id) => {
            if (!isNaN(parseInt(id))) {
                // find by index number
                id = this.serviceRegistry[Object.keys(this.serviceRegistry)[id]]
            } else {
                // find by id
                id = this.serviceRegistry[id]
            }

            return id
        },
        attachServiceSTD: (id) => {
            console.log(`Attaching service [${id}]`)

            if (id === "all") {
                console.clear()
                this.selectedProcessInstance = "all"
                return this.std.attachAllServicesSTD()
            }

            const service = this.std.findServiceById(id)

            if (!service) {
                console.error(`Service [${service}] not found`)
                return false
            }

            this.selectedProcessInstance = this.instancePool.find((instance) => instance.id === service.id)

            if (!this.selectedProcessInstance) {
                this.selectedProcessInstance = null

                console.error(`Cannot find service [${service.id}] in the instances pool`)

                return false
            }

            this.std.detachAllServicesSTD()
            console.clear()
            this.selectedProcessInstance.instance.logs.attach()

            return true
        },
        dettachServiceSTD: (id) => {


        },
        attachAllServicesSTD: () => {
            this.std.detachAllServicesSTD()

            for (let service of this.instancePool) {
                service.instance.logs.attach()
            }
        },
        detachAllServicesSTD: () => {
            for (let service of this.instancePool) {
                service.instance.logs.detach()
            }
        },
    }

    async initialize() {
        onExit(this.onGatewayExit)

        process.stdout.setMaxListeners(150)
        process.stderr.setMaxListeners(150)

        this.services = await scanServices()
        this.proxy = new Proxy()
        this.ipcRouter = new IPCRouter()

        global.eventBus = this.eventBus
        global.ipcRouter = this.ipcRouter
        global.proxy = this.proxy

        console.clear()
        console.log(comtyAscii)
        console.log(`\nRunning ${chalk.bgBlue(`${pkg.name}`)} | ${chalk.bgMagenta(`[v${pkg.version}]`)} | ${this.state.internalIp} \n\n\n`)

        if (this.services.length === 0) {
            console.error("❌ No services found")
            return process.exit(1)
        }

        console.log(`📦 Found ${this.services.length} service(s)`)

        Observable.observe(this.serviceRegistry, (changes) => {
            const { type } = changes[0]

            switch (type) {
                case "update": {
                    if (Object.values(this.serviceRegistry).every((service) => service.initialized)) {
                        this.onAllServicesReady()
                    }

                    break
                }
            }
        })

        await this.createServicesWatchers()

        await this.createServicesProcess()

        new RELP({
            attachAllServicesSTD: this.std.attachAllServicesSTD,
            detachAllServicesSTD: this.std.detachAllServicesSTD,
            attachServiceSTD: this.std.attachServiceSTD,
            dettachServiceSTD: this.std.dettachServiceSTD,
            reloadService: this.std.reloadService,
            onAllServicesReady: this.onAllServicesReady,
        })
    }
}