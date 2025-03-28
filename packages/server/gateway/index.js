require("dotenv").config()

import path from "node:path"
import EventEmitter from "@foxify/events"
import { Observable } from "@gullerya/object-observer"
import IPCRouter from "linebridge/dist/classes/IPCRouter"
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

import ServiceManager from "./services/manager"
import Service from "./services/service"

const isProduction = process.env.NODE_ENV === "production"

/**
 * Gateway class - Main entry point for the service orchestrator
 * Manages service discovery, spawning, and communication
 */
export default class Gateway {
	eventBus = new EventEmitter()

	state = {
		proxyPort: process.env.GATEWAY_LISTEN_PORT ?? 9000,
		internalIp: "0.0.0.0",
		allReady: false,
	}

	selectedService = null
	serviceManager = new ServiceManager()
	services = []
	serviceRegistry = Observable.from({})

	proxy = null
	ipcRouter = null

	/**
	 * Creates service registry entries based on discovered services
	 */
	async createServicesRegistry() {
		for await (const servicePath of this.services) {
			const instanceFile = path.basename(servicePath)
			const instanceBasePath = path.dirname(servicePath)
			const servicePkg = require(
				path.resolve(instanceBasePath, "package.json"),
			)

			this.serviceRegistry[servicePkg.name] = {
				index: this.services.indexOf(servicePath),
				id: servicePkg.name,
				version: servicePkg.version,
				file: instanceFile,
				cwd: instanceBasePath,
				ready: false,
			}
		}
	}

	/**
	 * Creates and initializes all service instances
	 */
	async createServiceInstances() {
		for await (const servicePath of this.services) {
			const instanceBasePath = path.dirname(servicePath)
			const servicePkg = require(
				path.resolve(instanceBasePath, "package.json"),
			)
			const serviceId = servicePkg.name

			const serviceConfig = {
				id: serviceId,
				version: servicePkg.version,
				path: servicePath,
				cwd: instanceBasePath,
				isProduction,
				internalIp: this.state.internalIp,
			}

			// Create service instance
			const service = new Service(serviceConfig, {
				onReady: this.onServiceReady.bind(this),
				onIPCData: this.onServiceIPCData.bind(this),
				onServiceExit: this.onServiceExit.bind(this),
			})

			// Add to service manager
			this.serviceManager.addService(service)

			// Initialize service
			await service.initialize()

			console.log(`📦 [${serviceId}] Service initialized`)
		}
	}

	/**
	 * Handler for service ready event
	 * @param {Service} service - Service that is ready
	 */
	onServiceReady(service) {
		const serviceId = service.id
		this.serviceRegistry[serviceId].initialized = true
		this.serviceRegistry[serviceId].ready = true

		console.log(
			`✅ [${serviceId}][${this.serviceRegistry[serviceId].index}] Ready`,
		)

		// Check if all services are ready
		this.checkAllServicesReady()
	}

	/**
	 * Handler for service IPC data
	 * @param {Service} service - Service sending the data
	 * @param {object} data - IPC data received
	 */
	async onServiceIPCData(service, data) {
		const id = service.id

		if (data.type === "log") {
			console.log(`[${id}] ${data.message}`)
		}

		if (data.status === "ready") {
			this.onServiceReady(service)
		}

		if (data.type === "router:register") {
			await this.handleRouterRegistration(service, data)
		}

		if (data.type === "router:ws:register") {
			await this.handleWebsocketRegistration(service, data)
		}
	}

	/**
	 * Handler for service exit
	 * @param {Service} service - Service that exited
	 * @param {number} code - Exit code
	 * @param {Error} error - Error if any
	 */
	onServiceExit(service, code, error) {
		const id = service.id

		this.serviceRegistry[id].initialized = true
		this.serviceRegistry[id].ready = false

		console.log(`[${id}] Exit with code ${code}`)

		if (error) {
			console.error(error)
		}

		this.proxy.unregisterAllFromService(id)
	}

	/**
	 * Handle router registration requests from services
	 * @param {Service} service - Service registering a route
	 * @param {object} msg - Registration message
	 */
	async handleRouterRegistration(service, msg) {
		const id = service.id

		if (msg.data.path_overrides) {
			for await (const pathOverride of msg.data.path_overrides) {
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

	/**
	 * Handle websocket registration requests from services
	 * @param {Service} service - Service registering a websocket
	 * @param {object} msg - Registration message
	 */
	async handleWebsocketRegistration(service, msg) {
		const id = service.id
		const listenPort = msg.data.listen_port ?? msg.data.listen?.port
		let target = `http://${this.state.internalIp}:${listenPort}`

		if (!msg.data.ws_path && msg.data.namespace) {
			target += `/${msg.data.namespace}`
		}

		if (msg.data.ws_path && msg.data.ws_path !== "/") {
			target += `/${msg.data.ws_path}`
		}

		await this.proxy.register({
			serviceId: id,
			path: `/${msg.data.namespace}`,
			target: target,
			pathRewrite: {
				[`^/${msg.data.namespace}`]: "",
			},
			ws: true,
		})
	}

	/**
	 * Check if all services are ready and trigger the ready event
	 */
	checkAllServicesReady() {
		if (this.state.allReady) return

		const allServicesInitialized = Object.values(
			this.serviceRegistry,
		).every((service) => service.initialized)

		if (allServicesInitialized) {
			this.onAllServicesReady()
		}
	}

	/**
	 * Reload all services
	 */
	reloadAllServices = () => {
		this.serviceManager.reloadAllServices()
	}

	/**
	 * Handle when all services are ready
	 */
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
	}

	/**
	 * Clean up resources on gateway exit
	 */
	onGatewayExit = () => {
		console.clear()
		console.log(`\n🛑 Preparing to exit...`)
		console.log(`Stopping proxy...`)

		this.proxy.close()
		console.log(`Stopping all services...`)
		this.serviceManager.stopAllServices()

		treeKill(process.pid)
	}

	/**
	 * Initialize the gateway and start all services
	 */
	async initialize() {
		onExit(this.onGatewayExit)

		// Increase limits to handle many services
		process.stdout.setMaxListeners(150)
		process.stderr.setMaxListeners(150)

		this.services = await scanServices()
		this.proxy = new Proxy()
		this.ipcRouter = new IPCRouter()

		if (this.services.length === 0) {
			console.error("❌ No services found")
			return process.exit(1)
		}

		// Make key components available globally
		global.eventBus = this.eventBus
		global.ipcRouter = this.ipcRouter
		global.proxy = this.proxy

		console.clear()
		console.log(comtyAscii)
		console.log(
			`\nRunning ${chalk.bgBlue(`${pkg.name}`)} | ${chalk.bgMagenta(`[v${pkg.version}]`)} | ${this.state.internalIp} | ${isProduction ? "production" : "development"} \n\n\n`,
		)

		console.log(`📦 Found ${this.services.length} service(s)`)

		// Watch for service state changes
		Observable.observe(this.serviceRegistry, (changes) => {
			this.checkAllServicesReady()
		})

		await this.createServicesRegistry()
		await this.createServiceInstances()

		// Initialize REPL interface
		new RELP({
			attachAllServicesSTD: () =>
				this.serviceManager.attachAllServicesStd(),
			detachAllServicesSTD: () =>
				this.serviceManager.detachAllServicesStd(),
			attachServiceSTD: (id) => this.serviceManager.attachServiceStd(id),
			dettachServiceSTD: (id) => this.serviceManager.detachServiceStd(id),
			reloadService: () => {
				const selectedService = this.serviceManager.getSelectedService()
				if (!selectedService) {
					console.error(`No service selected`)
					return false
				}

				if (selectedService === "all") {
					return this.reloadAllServices()
				}

				return selectedService.reload()
			},
			onAllServicesReady: this.onAllServicesReady,
		})
	}
}
