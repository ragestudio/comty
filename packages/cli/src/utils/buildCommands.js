export default async function buildCommands(commands, program) {
	for await (const command of commands) {
		if (typeof command.fn !== "function") {
			continue
		}

		const commandInstance = program.command(command.cmd).action(command.fn)

		if (command.description) {
			commandInstance.description(command.description)
		}

		if (command.options) {
			for (const option of command.options) {
				commandInstance.option(option.option, option.description)
			}
		}

		if (command.arguments) {
			for (const argument of command.arguments) {
				commandInstance.argument(
					argument.argument,
					argument.description,
				)
			}
		}
	}

	return program
}
