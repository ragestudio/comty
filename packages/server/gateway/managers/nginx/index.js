import fs from "node:fs/promises"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { execSync, spawn } from "node:child_process"
import { platform } from "node:os"

const localNginxBinary = path.resolve(process.cwd(), "nginx-bin")

/**
 * NginxManager - Optimized version that batches configurations
 * Waits for all services to register before applying configuration
 */
export default class NginxManager {
	constructor(options = {}) {
		this.options = options

		this.ssl = {
			on: false,
			cert_file_name: null,
			key_file_name: null,
		}
		this.port = options.port || 9000
		this.internalIp = options.internalIp || "0.0.0.0"

		// Set binary path
		this.nginxBinary = existsSync(localNginxBinary)
			? localNginxBinary
			: "nginx"

		// Directory structure
		this.nginxWorkDir =
			options.nginxWorkDir || path.join(process.cwd(), ".nginx")
		this.configDir = path.join(this.nginxWorkDir, "conf")
		this.tempDir = path.join(this.nginxWorkDir, "temp")
		this.logsDir = path.join(this.tempDir, "logs")
		this.cacheDir = path.join(this.tempDir, "cache")

		// Configuration files
		this.mainConfigPath = path.join(this.configDir, "nginx.conf")
		this.servicesConfigPath = path.join(this.configDir, "services.conf")

		// Process reference
		this.nginxProcess = null
		this.isNginxRunning = false

		// Debug mode
		this.debug = options.debug || false

		if (
			existsSync(this.options.cert_file_name) &&
			existsSync(this.options.key_file_name)
		) {
			console.log("[nginx] Setting SSL listen mode")
			this.ssl.on = true
			this.ssl.cert_file_name = this.options.cert_file_name
			this.ssl.key_file_name = this.options.key_file_name
		}
	}

	routes = new Map() // key: path, value: { serviceId, target, pathRewrite, ws }

	/**
	 * Initialize the directory structure and configuration files
	 */
	async initialize() {
		try {
			// Create directories
			this._ensureDirectories()

			// Create mime.types file
			await this.writeMimeTypes()

			// Generate main config file
			await this.generateMainConfig()

			console.log(`🔧 Using Nginx binary: ${this.nginxBinary}`)
			return true
		} catch (error) {
			console.error("❌ Failed to initialize Nginx configuration:", error)
			return false
		}
	}

	/**
	 * Ensure all required directories exist
	 */
	_ensureDirectories() {
		const dirs = [
			this.configDir,
			this.tempDir,
			this.logsDir,
			this.cacheDir,
			path.join(this.cacheDir, "client_body"),
			path.join(this.cacheDir, "proxy"),
		]

		// Create all directories
		for (const dir of dirs) {
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true })
			}
		}

		// Create empty log files
		const logFiles = [
			path.join(this.logsDir, "access.log"),
			path.join(this.logsDir, "error.log"),
		]

		for (const file of logFiles) {
			if (!existsSync(file)) {
				writeFileSync(file, "")
			}
		}
	}

	/**
	 * Generate the main Nginx configuration file
	 */
	async generateMainConfig() {
		// Normalize paths for Nginx
		const normalizedConfigDir = this.configDir.replace(/\\/g, "/")
		const normalizedTempDir = this.tempDir.replace(/\\/g, "/")
		const normalizedLogsDir = path
			.join(this.tempDir, "logs")
			.replace(/\\/g, "/")
		const normalizedCacheDir = path
			.join(this.tempDir, "cache")
			.replace(/\\/g, "/")

		const config = `
# Nginx configuration for Comty API Gateway
# Auto-generated - Do not edit manually

worker_processes auto;
error_log ${normalizedLogsDir}/error.log ${this.debug ? "debug" : "error"};
pid ${normalizedTempDir}/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include ${normalizedConfigDir}/mime.types;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    log_format debug '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'upstream_addr: $upstream_addr '
                    'upstream_status: $upstream_status '
                    'request_time: $request_time '
                    'http_version: $server_protocol';

    access_log ${normalizedLogsDir}/access.log ${this.debug ? "debug" : "main"};

    sendfile on;
    tcp_nopush on;

    tcp_nodelay on;

    client_max_body_size 100M;

    # WebSocket support
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    # Temp directories
    client_body_temp_path ${normalizedCacheDir}/client_body;
    proxy_temp_path ${normalizedCacheDir}/proxy;

    # Set proxy timeouts
    proxy_connect_timeout 60s;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;

    server {
            ${this.ssl.on ? `listen ${this.port} ssl;` : `listen ${this.port};`}
            server_name _;

            ${this.ssl.cert_file_name ? `ssl_certificate ${this.ssl.cert_file_name};` : ""}
            ${this.ssl.key_file_name ? `ssl_certificate_key ${this.ssl.key_file_name};` : ""}

            # Default route
            location / {
              add_header Content-Type application/json;
              add_header 'Access-Control-Allow-Origin' '*' always;
              add_header 'Access-Control-Allow-Headers' '*' always;
              add_header 'Access-Control-Allow-Methods' 'GET,HEAD,PUT,PATCH,POST,DELETE' always;

              return 200 '{"ok":1}';
            }

            # Include service-specific configurations
            include ${normalizedConfigDir}/services.conf;
        }
    }
`

		console.log(`📝 Nginx configuration initialized at ${this.configDir}`)

		await fs.writeFile(this.mainConfigPath, config)
	}

	// Create mime.types file if it doesn't exist
	async writeMimeTypes() {
		const mimeTypesPath = path.join(this.configDir, "mime.types")

		if (!existsSync(mimeTypesPath)) {
			// Basic MIME types
			const mimeTypes = `types {
    text/html                                        html htm shtml;
    text/css                                         css;
    text/xml                                         xml;
    image/gif                                        gif;
    image/jpeg                                       jpeg jpg;
    application/javascript                           js;
    text/plain                                       txt;
    image/png                                        png;
    image/svg+xml                                    svg svgz;
    application/json                                 json;
}`

			await fs.writeFile(mimeTypesPath, mimeTypes)
		}
	}

	/**
	 * Register a new service route in Nginx - queues for batch processing
	 * @param {Object} routeConfig - Route configuration
	 * @returns {Boolean} - Success status
	 */
	async register(routeConfig) {
		try {
			const {
				serviceId,
				path: routePath,
				target,
				pathRewrite,
				websocket,
			} = routeConfig

			// Normalize path
			let normalizedPath = routePath.startsWith("/")
				? routePath
				: `/${routePath}`

			if (this.debug) {
				console.log(
					`🔍 Registering route for [${serviceId}]: ${normalizedPath} -> ${target} (${websocket ? "WebSocket" : "HTTP"})`,
				)
			}

			// Store the route with improved handling of path rewrites
			const effectivePathRewrite = pathRewrite || {}

			this.routes.set(normalizedPath, {
				serviceId,
				target,
				pathRewrite: effectivePathRewrite,
				websocket: !!websocket,
			})

			return true
		} catch (error) {
			console.error(
				`❌ Failed to register route for [${routeConfig.serviceId}]:`,
				error,
			)
			return false
		}
	}

	/**
	 * Apply the current configuration (generate config and reload/start Nginx)
	 */
	async applyConfiguration() {
		try {
			console.log(
				`🔄 Applying configuration with ${this.routes.size} routes...`,
			)

			// Generate services configuration
			await this.regenerateServicesConfig()

			// Verify configuration is valid
			const configTest = this.execNginxCommand(
				["-t", "-c", this.mainConfigPath],
				true,
			)
			if (!configTest.success) {
				throw new Error(
					`Configuration validation failed: ${configTest.error}`,
				)
			}

			console.log(`✅ Configuration applied successfully`)
		} catch (error) {
			console.error(`❌ Failed to apply configuration:`, error)
		}
	}

	/**
	 * Unregister all routes for a specific service
	 * @param {String} serviceId - Service ID to unregister
	 * @returns {Boolean} - Success status
	 */
	async unregisterAllFromService(serviceId) {
		try {
			// Find and remove all routes for this service
			for (const [path, route] of this.routes.entries()) {
				if (route.serviceId === serviceId) {
					this.routes.delete(path)
				}
			}

			console.log(`📝 Removed routes for service [${serviceId}]`)

			return true
		} catch (error) {
			console.error(
				`❌ Failed to unregister routes for service [${serviceId}]:`,
				error,
			)
			return false
		}
	}

	/**
	 * Regenerate the services configuration file
	 */
	async regenerateServicesConfig() {
		let config = `# Service routes\n# Last updated: ${new Date().toISOString()}\n# Total routes: ${this.routes.size}\n\n`

		// Special case - no routes yet
		if (this.routes.size === 0) {
			config += "# No services registered yet\n"
			await fs.writeFile(this.servicesConfigPath, config)
			return
		}

		// Add all routes
		for (const [path, route] of this.routes.entries()) {
			config += this.generateLocationBlock(path, route)
		}

		// Write the config
		await fs.writeFile(this.servicesConfigPath, config)

		if (this.debug) {
			console.log(`📄 Writted [${this.routes.size}] service routes`)
		}
	}

	/**
	 * Generate a location block for a route
	 * @param {String} path - Route path
	 * @param {Object} route - Route configuration
	 * @returns {String} - Nginx location block
	 */
	generateLocationBlock(path, route) {
		// Create rewrite configuration if needed
		let rewriteConfig = ""

		if (route.pathRewrite && Object.keys(route.pathRewrite).length > 0) {
			rewriteConfig += "# Path rewrite rules\n"
			for (const [pattern, replacement] of Object.entries(
				route.pathRewrite,
			)) {
				// Improved rewrite pattern that preserves query parameters
				rewriteConfig += `\trewrite ${pattern} ${replacement}$is_args$args break;`
			}
		} else {
			// If no explicit rewrite is defined, but we need to strip the path prefix,
			// Generate a default rewrite that preserves the URL structure
			if (path !== "/") {
				rewriteConfig += "# Default path rewrite to strip prefix\n"
				rewriteConfig += `\trewrite ^${path}(/.*)$ $1$is_args$args break;\n`
				rewriteConfig += `\trewrite ^${path}$ / break;`
			}
		}

		// Determine if this is a root location or a more specific path
		const locationDirective =
			path === "/" ? "location /" : `location ${path}`

		// Build the full location block with proper indentation
		return `
${locationDirective} {
    if ($request_method = OPTIONS) {
      add_header 'Access-Control-Allow-Origin' '*';
      add_header 'Access-Control-Allow-Headers' '*';
      add_header 'Access-Control-Allow-Methods' 'GET,HEAD,PUT,PATCH,POST,DELETE';

      return 200;
    }

    # Set proxy configuration
    proxy_http_version 1.1;
    proxy_pass_request_headers on;

    # Standard proxy headers
    proxy_set_header Host $host:$server_port;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Set headers for WebSocket support
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    # Proxy pass to service
    proxy_pass ${route.target};
}
`
	}

	/**
	 * Start the Nginx server
	 * @returns {Boolean} - Success status
	 */
	async start() {
		try {
			// Start Nginx
			this.nginxProcess = spawn(
				this.nginxBinary,
				[
					"-c",
					this.mainConfigPath,
					"-g",
					"daemon off;",
					"-p",
					this.tempDir,
				],
				{
					stdio: ["ignore", "pipe", "pipe"],
				},
			)

			this.nginxProcess.stdout.on("data", (data) => {
				console.log(`[Nginx] ${data.toString().trim()}`)
			})

			this.nginxProcess.stderr.on("data", (data) => {
				console.error(`[Nginx] ${data.toString().trim()}`)
			})

			this.nginxProcess.on("close", (code) => {
				this.isNginxRunning = false
				if (code !== 0 && code !== null) {
					console.error(`Nginx process exited with code ${code}`)
				}
				this.nginxProcess = null
			})

			// Wait briefly to check for immediate startup errors
			await new Promise((resolve) => setTimeout(resolve, 500))

			if (this.nginxProcess.exitCode !== null) {
				throw new Error(
					`Nginx failed to start (exit code: ${this.nginxProcess.exitCode})`,
				)
			}

			this.isNginxRunning = true
			console.log(`🚀 Nginx started on port ${this.port}`)
			return true
		} catch (error) {
			this.isNginxRunning = false
			console.error("❌ Failed to start Nginx:", error.message)
			return false
		}
	}

	/**
	 * Execute an Nginx command
	 * @param {Array} args - Command arguments
	 * @param {Boolean} returnOutput - Whether to return command output
	 * @returns {Object} - Success status and output/error
	 */
	execNginxCommand(args, returnOutput = false) {
		try {
			// Always include prefix to set the temp directory
			const allArgs = [...args, "-p", this.tempDir]

			const cmdString = `"${this.nginxBinary}" ${allArgs.join(" ")}`

			if (this.debug) {
				console.log(`🔍 Executing: ${cmdString}`)
			}

			const output = execSync(cmdString, {
				encoding: "utf8",
				stdio: returnOutput ? "pipe" : "inherit",
			})

			return {
				success: true,
				output: returnOutput ? output : null,
			}
		} catch (error) {
			return {
				success: false,
				error: error.message,
				output: error.stdout,
			}
		}
	}

	/**
	 * Reload the Nginx configuration
	 * @returns {Boolean} - Success status
	 */
	async reload() {
		try {
			// Test configuration validity
			const configTest = this.execNginxCommand(
				["-t", "-c", this.mainConfigPath],
				true,
			)
			if (!configTest.success) {
				throw new Error(
					`Configuration test failed: ${configTest.error}`,
				)
			}

			// If Nginx isn't running, start it
			if (
				!this.isNginxRunning ||
				!this.nginxProcess ||
				this.nginxProcess.exitCode !== null
			) {
				return await this.start()
			}

			// Send reload signal
			const result = this.execNginxCommand([
				"-s",
				"reload",
				"-c",
				this.mainConfigPath,
			])

			if (!result.success) {
				throw new Error(`Failed to reload Nginx: ${result.error}`)
			}

			console.log("🔄 Nginx configuration reloaded")
			return true
		} catch (error) {
			console.error("❌ Failed to reload Nginx:", error.message)
			return false
		}
	}

	/**
	 * Stop the Nginx server
	 * @returns {Boolean} - Success status
	 */
	async close() {
		try {
			if (this.nginxProcess) {
				// Try graceful shutdown first
				this.execNginxCommand(["-s", "quit", "-c", this.mainConfigPath])

				// Give Nginx time to shut down
				await new Promise((resolve) => setTimeout(resolve, 1000))

				// If still running, force kill
				if (this.nginxProcess && this.nginxProcess.exitCode === null) {
					this.nginxProcess.kill("SIGTERM")

					// If STILL running after another second, use SIGKILL
					await new Promise((resolve) => setTimeout(resolve, 1000))
					if (
						this.nginxProcess &&
						this.nginxProcess.exitCode === null
					) {
						this.nginxProcess.kill("SIGKILL")
					}
				}

				this.nginxProcess = null
			}

			this.isNginxRunning = false
			console.log("🛑 Nginx stopped")
			return true
		} catch (error) {
			console.error("❌ Failed to stop Nginx:", error.message)
			return false
		}
	}
}
