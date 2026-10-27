import type { DexieCompat } from "./wrapper/compat"

import { useEffect, useRef, useState } from "react"
import db from "./instance"
import logger from "@/utils/logger"

// compare query results so unrelated transactions do not trigger renders
function isEqual(a: unknown, b: unknown) {
	if (Object.is(a, b)) return true

	try {
		return JSON.stringify(a) === JSON.stringify(b)
	} catch {
		return false
	}
}

export function useLiveQuery<T>(
	querier: () => Promise<T> | T,
	deps: unknown[] = [],
	dbInstance: DexieCompat = db,
): T | undefined {
	const [data, setData] = useState<T | undefined>(undefined)
	const querierRef = useRef(querier)

	querierRef.current = querier

	useEffect(() => {
		let active = true
		let running = false
		let dirty = false
		let generation = 0

		const run = async () => {
			if (!active) return

			// coalesce transactions that happen while a query is in flight
			if (running) {
				dirty = true
				return
			}

			running = true

			try {
				do {
					dirty = false

					const currentGeneration = ++generation

					try {
						const result = await querierRef.current()

						if (active && currentGeneration === generation) {
							setData((previous) =>
								isEqual(previous, result) ? previous : result,
							)
						}
					} catch (err) {
						logger.error("live query failed", err)
					}
				} while (dirty && active)
			} finally {
				running = false
			}

			if (dirty && active) {
				run()
			}
		}

		run()

		const unsubscribe = dbInstance.subscribe(run)

		return () => {
			active = false
			unsubscribe()
		}
	}, deps)

	return data
}

export default useLiveQuery
