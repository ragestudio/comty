import { Config } from "@db_models"

export default class Limits {
    static async get(key) {
        const { value } = await Config.findOne({
            key: "limits"
        }).catch(() => {
            return {
                value: {}
            }
        })

        const limits = {
            maxChunkSizeInMB: 5,
            maxFileSizeInMB: 8,
            maxNumberOfFiles: 10,
            maxPostCharacters: 2000,
            maxAccountsPerIp: 10,
            ...value,
        }

        if (typeof key === "string") {
            return {
                value: limits[key] ?? null
            }
        }

        if (Array.isArray(key)) {
            const result = {}

            key.forEach((k) => {
                result[k] = limits[k] ?? null
            })

            return result
        }

        return limits
    }
}