import type { Persister, Persists } from "tinybase/persisters"

import logger from "@/utils/logger"

export type SpacesPersister = Persister<Persists.StoreOrMergeableStore>

let currentPersister: SpacesPersister | null = null

export async function attachPersister(persister: SpacesPersister) {
	if (currentPersister === persister) {
		return persister
	}

	await detachPersister()

	try {
		await persister.startAutoPersisting()
	} catch (err) {
		await persister.destroy().catch(logger.error)
		throw err
	}

	currentPersister = persister

	return persister
}

export async function detachPersister() {
	if (!currentPersister) return

	const persister = currentPersister

	currentPersister = null

	try {
		await persister.stopAutoPersisting()
	} catch (err) {
		logger.error("failed to stop database persistence", err)
	}

	await persister.destroy().catch((err) => {
		logger.error("failed to destroy database persister", err)
	})
}

export function getPersister() {
	return currentPersister
}
