export default async function importDefaults(commands) {
	const result = []

	for await (const command of commands) {
		const commandModule = await import(command)
		result.push(commandModule.default)
	}

	return result
}
