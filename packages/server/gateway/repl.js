export default class RELP {
	constructor(gateway, handlers) {
		this.gateway = gateway
		this.handlers = handlers
		this.initCommandLine()
	}

	initCommandLine() {
		if (!process.stdin) {
			console.error(
				"Failed to initialize command line: stdin is not available",
			)
			return null
		}

		// Configure line-by-line input mode
		process.stdin.setEncoding("utf8")
		process.stdin.resume()
		process.stdin.setRawMode(true)

		// Buffer to store user input
		this.inputBuffer = ""

		// Show initial prompt
		this.showPrompt()

		// Handle user input
		process.stdin.on("data", (data) => {
			const key = data.toString()

			// Ctrl+C to exit
			if (key === "\u0003") {
				process.exit(0)
			}

			// Enter key
			if (key === "\r" || key === "\n") {
				// Move to a new line
				console.log()

				// Process the command
				const command = this.inputBuffer.trim()
				if (command) {
					this.processCommand(command)
				}

				// Clear the buffer
				this.inputBuffer = ""

				// Show the prompt again
				this.showPrompt()
				return
			}

			// Backspace/Delete
			if (key === "\b" || key === "\x7f") {
				if (this.inputBuffer.length > 0) {
					// Delete a character from the buffer
					this.inputBuffer = this.inputBuffer.slice(0, -1)

					// Update the line in the terminal
					process.stdout.write("\r\x1b[K> " + this.inputBuffer)
				}
				return
			}

			// Normal characters
			if (key.length === 1 && key >= " ") {
				this.inputBuffer += key
				process.stdout.write(key)
			}
		})

		// Intercept console.log to keep the prompt visible
		const originalConsoleLog = console.log
		console.log = (...args) => {
			// Clear the current line
			process.stdout.write("\r\x1b[K")

			// Print the message
			originalConsoleLog(...args)

			// Reprint the prompt and current buffer
			this.showPrompt(false)
		}

		// Do the same with console.error
		const originalConsoleError = console.error
		console.error = (...args) => {
			// Clear the current line
			process.stdout.write("\r\x1b[K")

			// Print the error message
			originalConsoleError(...args)

			// Reprint the prompt and current buffer
			this.showPrompt(false)
		}
	}

	showPrompt(newLine = true) {
		if (newLine) {
			process.stdout.write("\r")
		}
		process.stdout.write("> " + this.inputBuffer)
	}

	processCommand(input) {
		const inputs = input.split(" ")
		const command = inputs[0]
		const args = inputs.slice(1)

		this.inputBuffer = ""

		const commandFn = this.commands.find((relpCommand) => {
			if (relpCommand.cmd === command) {
				return true
			}

			if (Array.isArray(relpCommand.aliases)) {
				return relpCommand.aliases.includes(command)
			}

			return false
		})

		if (!commandFn) {
			console.error(`Command not found: ${command}`)
			return
		}

		// Adapter to maintain compatibility with the original API
		const callback = (result) => {
			if (result) {
				console.log(result)
			}
		}

		try {
			commandFn.fn(callback, ...args)
		} catch (error) {
			console.error(`Error executing command: ${error.message}`)
		}
	}

	commands = [
		{
			cmd: "list",
			aliases: ["ls"],
			fn: (cb) => {
				const gateway = this.handlers.gateway()

				console.log(gateway.serviceRegistry)
			},
		},
		{
			cmd: "select",
			aliases: ["s", "sel"],
			fn: (cb, service) => {
				this.handlers.detachAllServicesSTD()
				return this.handlers.attachServiceSTD(service)
			},
		},
		{
			cmd: "reload",
			aliases: ["r"],
			fn: () => {
				this.handlers.reloadService()
			},
		},
		{
			cmd: "exit",
			aliases: ["e"],
			fn: () => {
				process.exit(0)
			},
		},
	]
}
