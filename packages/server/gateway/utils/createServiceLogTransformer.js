import { Transform } from "node:stream"
import chalk from "chalk"

export default ({ id, color = "bgCyan" }) => {
    return new Transform({
        transform(data, encoding, callback) {
            callback(null, `${chalk[color](`[${id}]`)} > ${data.toString()}`)
        }
    })
}