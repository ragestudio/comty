require("dotenv").config()

import path from "node:path"
import EventEmitter from "@foxify/events"
import { Observable } from "@gullerya/object-observer"
import IPCRouter from "linebridge/dist/classes/IPCRouter"
import { onExit } from "signal-exit"
import chalk from "chalk"
import treeKill from "tree-kill"

import scanServices from "./utils/scanServices"
import RELP from "./repl"
import comtyAscii from "./ascii"
import pkg from "../package.json"

import ServiceManager from "./services/manager"
import Service from "./services/service"
import * as Managers from "./managers"

global.debugFlag = process.env.DEBUG === "true"
const isProduction = process.env.NODE_ENV === "production"

const sslKey = path.resolve(process.cwd(), ".ssl", "privkey.pem")
const sslCert = path.resolve(process.cwd(), ".ssl", "cert.pem")

/**
 * Gateway class - Main entry point for the service orchestrator
 * Manages service discovery, spawning, and communication
 */
export default class Gateway {
	static gatewayMode = process.env.GATEWAY_MODE ?? "http_proxy"

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

	gateway = null

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
		if (!debugFlag) {
			console.log(`🔰 Starting all services, please wait...`)
		}

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
			console.log(`[ipc:${id}] ${data.message}`)
		}

		if (data.status === "ready") {
			this.onServiceReady(service)
		}

		if (data.type === "service:register") {
			await this.handleServiceRegistration(service, data)
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

		if (typeof this.gateway.unregisterAllFromService === "function") {
			this.gateway.unregisterAllFromService(id)
		}
	}

	/**
	 * Handle both router and websocket registration requests from services
	 * @param {Service} service - Service registering a route or websocket
	 * @param {object} msg - Registration message
	 * @param {boolean} isWebsocket - Whether this is a websocket registration
	 */
	async handleServiceRegistration(service, data) {
		const { id } = service
		const { namespace, http, websocket, listen } = data.register

		if (http && http.enabled === true && Array.isArray(http.paths)) {
			for (const path of http.paths) {
				await this.gateway.register({
					serviceId: id,
					path: path,
					target: `${http.proto}://${listen.ip}:${listen.port}${path}`,
				})
			}
		}

		if (websocket && websocket.enabled === true) {
			await this.gateway.register({
				serviceId: id,
				websocket: true,
				path: websocket.path,
				target: `${http.proto}://${listen.ip}:${listen.port}${websocket.path}`,
			})
		}

		if (this.state.allReady) {
			if (typeof this.gateway.applyConfiguration === "function") {
				await this.gateway.applyConfiguration()
			}
			if (typeof this.gateway.reload === "function") {
				await this.gateway.reload()
			}
		}
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
			this.state.allReady = true
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
		//console.clear()
		//console.log(comtyAscii)

		console.log("\n")
		console.log(`🎉 All services[${this.services.length}] ready!\n`)
		console.log(`USE: select <service>, reload, exit\n`)

		if (typeof this.gateway.applyConfiguration === "function") {
			await this.gateway.applyConfiguration()
		}

		if (typeof this.gateway.start === "function") {
			await this.gateway.start()
		}
	}

	/**
	 * Clean up resources on gateway exit
	 */
	onGatewayExit = () => {
		//console.clear()
		console.log(`\n🛑 Preparing to exit...`)

		if (typeof this.gateway.stop === "function") {
			console.log(`Stopping gateway...`)
			this.gateway.stop()
		}

		console.log(`Stopping all services...`)
		this.serviceManager.stopAllServices()

		treeKill(process.pid)
	}

	/**
	 * Initialize the gateway and start all services
	 */
	async initialize() {
		if (!Managers[this.constructor.gatewayMode]) {
			console.error(
				`❌ Gateway mode [${this.constructor.gatewayMode}] not supported`,
			)
			return 0
		}

		onExit(this.onGatewayExit)

		// Increase limits to handle many services
		process.stdout.setMaxListeners(150)
		process.stderr.setMaxListeners(150)

		this.services = await scanServices()
		this.ipcRouter = new IPCRouter()

		global.eventBus = this.eventBus
		global.ipcRouter = this.ipcRouter

		if (this.services.length === 0) {
			console.error("❌ No services found")
			return process.exit(1)
		}

		console.log(comtyAscii)
		console.log(
			`\nRunning ${chalk.bgBlue(`${pkg.name}`)} | ${chalk.bgMagenta(`[v${pkg.version}]`)} | ${this.state.internalIp} | ${isProduction ? "production" : "development"} | ${this.constructor.gatewayMode} |\n`,
		)

		console.log(`📦 Found ${this.services.length} service(s)`)

		// Initialize gateway
		this.gateway = new Managers[this.constructor.gatewayMode]({
			port: this.state.proxyPort,
			internalIp: this.state.internalIp,
			cert_file_name: sslCert,
			key_file_name: sslKey,
		})

		if (typeof this.gateway.initialize === "function") {
			await this.gateway.initialize()
		}

		// Watch for service state changes
		Observable.observe(this.serviceRegistry, (changes) => {
			this.checkAllServicesReady()
		})

		await this.createServicesRegistry()
		await this.createServiceInstances()

		// WARNING: Starting relp makes uwebsockets unable to work properly, surging some bugs from nodejs (domain.enter)
		// use another alternative to parse commands, like stdin reading or something...
		this.startRELP()
	}

	startRELP() {
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
