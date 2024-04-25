import repl from "node:repl"

export default class RELP {
    constructor(handlers) {
        this.handlers = handlers

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

                const command_fn = this.commands.find((relp_command) => {
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
    }

    commands = [
        {
            cmd: "select",
            aliases: ["s", "sel"],
            fn: (cb, service) => {
                this.handlers.detachAllServicesSTD()

                return this.handlers.attachServiceSTD(service)
            }
        },
        {
            cmd: "reload",
            aliases: ["r"],
            fn: () => {
                this.handlers.reloadService()
            }
        },
        {
            cmd: "exit",
            aliases: ["e"],
            fn: () => {
                process.exit(0)
            }
        }
    ]
}