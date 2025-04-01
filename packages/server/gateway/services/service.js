import chokidar from "chokidar"
import path from "path"
import { minimatch } from "minimatch"
import spawnService from "../utils/spawnService"
import getIgnoredFiles from "../utils/getIgnoredFiles"

/**
 * Service class - Represents a single service instance
 * Manages the lifecycle, communication, and monitoring of a service
 */
export default class Service {
	/**
	 * @param {object} config - Service configuration
	 * @param {string} config.id - Service identifier
	 * @param {string} config.version - Service version
	 * @param {string} config.path - Path to service entry file
	 * @param {string} config.cwd - Current working directory
	 * @param {boolean} config.isProduction - Whether running in production mode
	 * @param {string} config.internalIp - Internal IP address
	 * @param {object} handlers - Event handlers
	 * @param {Function} handlers.onReady - Called when service is ready
	 * @param {Function} handlers.onIPCData - Called when IPC data is received
	 * @param {Function} handlers.onServiceExit - Called when service exits
	 */
	constructor(config, handlers) {
		this.id = config.id
		this.version = config.version
		this.path = config.path
		this.cwd = config.cwd
		this.isProduction = config.isProduction
		this.internalIp = config.internalIp

		this.instance = null
		this.fileWatcher = null

		this.handlers = handlers
	}

	/**
	 * Initialize the service and start its process
	 */
	async initialize() {
		await this.startProcess()

		if (!this.isProduction) {
			await this.setupFileWatcher()
		}
	}

	/**
	 * Start the service process
	 */
	async startProcess() {
		this.instance = await spawnService({
			id: this.id,
			service: this.path,
			cwd: this.cwd,
			onClose: this.handleClose.bind(this),
			onError: this.handleError.bind(this),
			onIPCData: this.handleIPCData.bind(this),
		})

		this.instance.logs.attach()
		return this.instance
	}

	/**
	 * Set up file watcher for development hot-reload
	 */
	async setupFileWatcher() {
		const ignored = [
			...(await getIgnoredFiles(this.cwd)),
			"**/.cache/**",
			"**/node_modules/**",
			"**/dist/**",
			"**/build/**",
		]

		this.fileWatcher = chokidar.watch(this.cwd, {
			ignored: (path) =>
				ignored.some((pattern) => minimatch(path, pattern)),
			persistent: true,
			ignoreInitial: true,
		})

		this.fileWatcher.on("all", (event, filePath) => {
			console.log(`[${this.id}] File changed: ${event} ${filePath}`)
			this.reload()
		})
	}

	/**
	 * Handle IPC data from the service
	 * @param {string} id - Service ID
	 * @param {object} data - IPC data
	 */
	handleIPCData(id, data) {
		if (this.handlers.onIPCData) {
			this.handlers.onIPCData(this, data)
		}
	}

	/**
	 * Handle service closure
	 * @param {string} id - Service ID
	 * @param {number} code - Exit code
	 * @param {Error} error - Error if any
	 */
	async handleClose(id, code, error) {
		if (this.handlers.onServiceExit) {
			await this.handlers.onServiceExit(this, code, error)
		}

		// In production, we might want to restart the service
		if (this.isProduction && code !== 0) {
			console.error(`[${this.id}] Service crashed, restarting...`)
			await new Promise((resolve) => setTimeout(resolve, 1000))
			await this.reload()
		}
	}

	/**
	 * Handle service errors
	 * @param {string} id - Service ID
	 * @param {Error} error - Error object
	 */
	handleError(id, error) {
		console.error(`[${this.id}] Error:`, error)
	}

	/**
	 * Reload the service
	 */
	async reload() {
		console.log(`[${this.id}] Reloading service...`)

		// Kill the current process if is running
		if (this.instance.exitCode === null) {
			console.log(`[${this.id}] Killing current process...`)
			await this.instance.kill("SIGKILL")
		}

		// Start a new process
		await this.startProcess()

		return true
	}

	/**
	 * Stop the service
	 */
	async stop() {
		console.log(`[${this.id}] Stopping service...`)

		if (this.fileWatcher) {
			await this.fileWatcher.close()
			this.fileWatcher = null
		}

		if (this.instance) {
			await this.instance.kill("SIGKILL")
			this.instance = null
		}
	}

	/**
	 * Attach to service standard output
	 */
	attachStd() {
		if (this.instance) {
			this.instance.logs.attach()
		}
	}

	/**
	 * Detach from service standard output
	 */
	detachStd() {
		if (this.instance) {
			this.instance.logs.detach()
		}
	}
}
