// @ts-ignore
import { Config } from "@db_models"

export interface LimitsValues extends Record<string, any> {}

export const LimitsValues = {
	maxChunkSizeInMB: 5,
	maxFileSizeInMB: 8,
	maxNumberOfFiles: 10,
	maxPostCharacters: 2000,
	maxAccountsPerIp: 10,
}

export default class Limits {
	static async get(key: string | Array<string>) {
		const values = await this.getAll()

		if (typeof key === "string") {
			return values[key]
		}

		if (Array.isArray(key)) {
			return key.reduce((prev, curr) => {
				return (prev[curr] = values[curr])
			}, {})
		}

		return null
	}

	static async getAll(): Promise<LimitsValues> {
		return {
			...LimitsValues,
			...(await this.getConfigObjFromDB()),
		}
	}

	private static async getConfigObjFromDB() {
		const { value } = await Config.findOne({
			key: "limits",
		}).catch(() => {
			return {
				value: {},
			}
		})

		return value
	}
}
