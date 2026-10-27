import {
	createIndexedDbPersister,
	type IndexedDbPersister,
} from "tinybase/persisters/persister-indexed-db"

import db from "./instance"
import { attachPersister, detachPersister } from "./persistence"

export const WEB_DB_NAME = "spaces"

let webPersister: IndexedDbPersister | null = null

export async function startWebPersistence() {
	if (webPersister) return webPersister
	if (typeof indexedDB === "undefined") return null

	const persister = createIndexedDbPersister(db.store, WEB_DB_NAME)

	try {
		await attachPersister(persister)
	} catch {
		return null
	}

	webPersister = persister

	return persister
}

export async function stopWebPersistence() {
	if (!webPersister) return

	webPersister = null

	await detachPersister()
}
