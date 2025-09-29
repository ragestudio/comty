import { Console } from "node:console"
import { Transform } from "node:stream"
import chalk from "chalk"

export default class InternalConsole {
	constructor() {
		this.stdout = new Transform({
			transform(data, encoding, callback) {
				callback(
					null,
					`${InternalConsole.lineHeader}:: ${data.toString()}`,
				)
			},
		})

		this.stderr = new Transform({
			transform(data, encoding, callback) {
				callback(
					null,
					`${InternalConsole.lineHeader} ${chalk.blackBright.bgRed(["ERR"])}::\n${data.toString()}`,
				)
			},
		})

		this.stdout.pipe(process.stdout)
		this.stderr.pipe(process.stderr)

		return new Console({
			stdout: this.stdout,
			stderr: this.stderr,
		})
	}

	static get lineHeader() {
		return chalk.blackBright.bgMagenta(`[ultra_gateway]`)
	}
}
