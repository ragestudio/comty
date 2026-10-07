import { useState, useEffect } from "react"
import { DexieCompat } from "./compat"

export function useLiveQuery<T>(
	querier: () => Promise<T>,
	deps: any[] = [],
	dbInstance?: DexieCompat,
): T | undefined {
	const [data, setData] = useState<T | undefined>(undefined)

	useEffect(() => {
		let isMounted = true

		const executeQuery = async () => {
			try {
				const result = await querier()
				if (isMounted) setData(result)
			} catch (err) {
				console.error("Error en useLiveQuery:", err)
			}
		}

		executeQuery()

		let listenerId: string | undefined

		if (dbInstance) {
			listenerId = dbInstance.store.addDidFinishTransactionListener(
				() => {
					executeQuery()
				},
			)
		}

		return () => {
			isMounted = false

			if (dbInstance && listenerId) {
				dbInstance.store.delListener(listenerId)
			}
		}
	}, deps)

	return data
}

export default useLiveQuery
