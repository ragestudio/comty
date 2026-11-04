import type {
	EnsureUsersOptions,
	SpacesUser,
	UserIdInput,
	UsersStoreType,
} from "./types"

import UserModel from "comty.js/endpoints/user"
import logger from "@comty/shared/utils/logger"
import db from "@/db"
import ActionsBase from "@/classes/BaseActions"

import { isSameUser, mergeUser, normalizeIds } from "./helpers"
import {
	USERS_BATCH_DELAY_MS,
	USERS_BATCH_SIZE,
	USERS_DECORATIONS_FRESH_MS,
	USERS_FRESH_MS,
	USERS_MISSING_TTL_MS,
} from "./constants"

// groups ids requested in the same tick into a single request, reuses the
// in flight promise when the same id is requested again
class BatchQueue {
	private queue = new Set<string>()
	private waiters: Array<() => void> = []
	private inFlight = new Map<string, Promise<void>>()
	private timer: ReturnType<typeof setTimeout> | null = null

	constructor(
		private batchSize: number,
		private delay: number,
		private request: (ids: string[]) => Promise<void>,
	) {}

	push(ids: string[]): Promise<void> {
		for (const id of ids) this.queue.add(id)

		return new Promise((resolve) => {
			this.waiters.push(resolve)
			this.schedule()
		})
	}

	private schedule() {
		if (this.timer) return

		this.timer = setTimeout(() => {
			this.timer = null
			void this.flush()
		}, this.delay)
	}

	private async flush() {
		const ids = Array.from(this.queue)
		const waiters = this.waiters

		this.queue.clear()
		this.waiters = []

		try {
			await this.dispatch(ids)
		} finally {
			for (const resolve of waiters) resolve()
		}
	}

	private async dispatch(ids: string[]) {
		const pending: Promise<void>[] = []
		const active: string[] = []

		for (const id of ids) {
			const current = this.inFlight.get(id)

			if (current) pending.push(current)
			else active.push(id)
		}

		for (let index = 0; index < active.length; index += this.batchSize) {
			const chunk = active.slice(index, index + this.batchSize)
			const promise = this.request(chunk).finally(() => {
				for (const id of chunk) this.inFlight.delete(id)
			})

			for (const id of chunk) this.inFlight.set(id, promise)
			pending.push(promise)
		}

		await Promise.allSettled(pending)
	}
}

export default class UsersActions extends ActionsBase<UsersStoreType> {
	private syncedAt = new Map<string, number>()
	private decorationsSyncedAt = new Map<string, number>()
	private missing = new Map<string, number>()
	private pendingDecorations = new Map<string, Record<string, any>>()

	private usersQueue = new BatchQueue(
		USERS_BATCH_SIZE,
		USERS_BATCH_DELAY_MS,
		(ids) => this.requestUsers(ids),
	)

	private decorationsQueue = new BatchQueue(
		USERS_BATCH_SIZE,
		USERS_BATCH_DELAY_MS,
		(ids) => this.requestDecorations(ids),
	)

	private presenceQueue = new BatchQueue(
		USERS_BATCH_SIZE,
		USERS_BATCH_DELAY_MS,
		(ids) => this.requestPresence(ids),
	)

	setUsers(users: SpacesUser[], options: { persist?: boolean } = {}): void {
		if (!Array.isArray(users) || users.length === 0) return

		const now = Date.now()
		const patch: Record<string, SpacesUser> = {}

		for (const incoming of users) {
			if (!incoming?._id) continue

			const id = String(incoming._id)
			const current = this.state.users[id]
			const merged = this.applyPendingDecorations(
				mergeUser(current, incoming, now),
			)

			this.missing.delete(id)

			// only a complete profile counts as fresh, partial payloads must
			// still be completed by the api
			if (merged.username) {
				this.syncedAt.set(id, now)
			}

			if (current && isSameUser(current, merged)) continue

			patch[id] = merged
		}

		if (Object.keys(patch).length === 0) return

		this.setState((state) => ({
			users: { ...state.users, ...patch },
			error: null,
		}))

		if (options.persist !== false) {
			this.persist(Object.values(patch))
		}
	}

	patchUser(
		userId: string,
		patch: Partial<SpacesUser>,
		options: { persist?: boolean } = {},
	): void {
		if (!userId) return

		this.setUsers([{ _id: userId, ...patch } as SpacesUser], options)
	}

	hydrateFromCache(users: SpacesUser[]): void {
		if (!Array.isArray(users) || users.length === 0) return

		const patch: Record<string, SpacesUser> = {}

		for (const user of users) {
			if (!user?._id) continue

			const id = String(user._id)
			const current = this.state.users[id]

			// a complete profile in memory always wins over the cache
			if (current?.username) continue

			const merged = mergeUser(current, user, user.cached_at ?? 0)

			if (!current?.decorations && user.decorations) {
				merged.decorations = user.decorations
			}

			patch[id] = this.applyPendingDecorations(merged)
			this.syncedAt.set(id, user.username ? (user.cached_at ?? 0) : 0)

			if (user.decorations) {
				this.decorationsSyncedAt.set(id, user.cached_at ?? 0)
			}
		}

		if (Object.keys(patch).length === 0) return

		this.setState((state) => ({
			users: { ...state.users, ...patch },
		}))
	}

	async ensure(
		input: UserIdInput,
		options: EnsureUsersOptions = {},
	): Promise<void> {
		const ids = normalizeIds(input)

		if (ids.length === 0) return

		// try the persistent cache before hitting the network
		if (!options.force) {
			const notLoaded = ids.filter((id) => !this.state.users[id]?.username)

			if (notLoaded.length > 0) {
				await this.loadCached(notLoaded)
			}
		}

		const now = Date.now()
		const maxAge = options.maxAge ?? USERS_FRESH_MS
		const stale: string[] = []

		for (const id of ids) {
			const user = this.state.users[id]
			const syncedAt = this.syncedAt.get(id) ?? 0
			const isFresh =
				!!user?.username && syncedAt > 0 && now - syncedAt < maxAge

			if (!options.force && isFresh) continue

			const missingAt = this.missing.get(id)

			if (
				!options.force &&
				missingAt &&
				now - missingAt < USERS_MISSING_TTL_MS
			) {
				continue
			}

			stale.push(id)
		}

		if (stale.length > 0) {
			await this.usersQueue.push(stale)
		}

		if (options.decorations) {
			await this.ensureDecorations(ids, options)
		}
	}

	async ensureDecorations(
		input: UserIdInput,
		options: Omit<EnsureUsersOptions, "decorations"> = {},
	): Promise<void> {
		const ids = normalizeIds(input)

		if (ids.length === 0) return

		const now = Date.now()
		const maxAge = options.maxAge ?? USERS_DECORATIONS_FRESH_MS
		const stale: string[] = []

		for (const id of ids) {
			const user = this.state.users[id]
			const syncedAt = this.decorationsSyncedAt.get(id) ?? 0
			const isFresh =
				(!!user?.decorations || this.pendingDecorations.has(id)) &&
				syncedAt > 0 &&
				now - syncedAt < maxAge

			if (!options.force && isFresh) continue

			stale.push(id)
		}

		if (stale.length === 0) return

		await this.decorationsQueue.push(stale)
	}

	invalidate(input?: UserIdInput): void {
		const ids = normalizeIds(input)
		const targets = ids.length > 0 ? ids : Object.keys(this.state.users)

		for (const id of targets) {
			this.syncedAt.delete(id)
			this.decorationsSyncedAt.delete(id)
			this.missing.delete(id)
		}
	}

	async ensurePresence(input: UserIdInput): Promise<void> {
		const ids = normalizeIds(input)

		if (ids.length === 0) return

		await this.presenceQueue.push(ids)
	}

	clearPresence(input?: UserIdInput): void {
		const ids = normalizeIds(input)
		const targets = ids.length > 0 ? ids : Object.keys(this.state.connections)

		if (targets.length === 0) return

		const connections = { ...this.state.connections }
		let changed = false

		for (const id of targets) {
			if (!(id in connections)) continue

			delete connections[id]
			changed = true
		}

		if (changed) this.setState({ connections })
	}

	reset(): void {
		this.syncedAt.clear()
		this.decorationsSyncedAt.clear()
		this.missing.clear()
		this.pendingDecorations.clear()

		this.setState({ users: {}, connections: {}, error: null })
	}

	private async loadCached(ids: string[]): Promise<void> {
		try {
			const cached = (await db.users.bulkGet(ids)) as (SpacesUser | undefined)[]

			this.hydrateFromCache(
				cached.filter((user): user is SpacesUser => Boolean(user)),
			)
		} catch (error) {
			logger.error("failed to load cached users", error)
		}
	}

	private async requestUsers(ids: string[]): Promise<void> {
		const startedAt = Date.now()

		try {
			const data = await UserModel.data({ user_id: ids.join(",") })
			const users = (Array.isArray(data) ? data : [data]).filter(
				Boolean,
			) as SpacesUser[]

			const found = new Set<string>()
			const usable: SpacesUser[] = []

			for (const user of users) {
				if (!user?._id) continue

				const id = String(user._id)
				found.add(id)

				// a local write that happened while this request was in flight
				// is newer than the response
				if ((this.syncedAt.get(id) ?? 0) > startedAt) continue

				usable.push(user)
			}

			if (usable.length > 0) {
				this.setUsers(usable)
			}

			for (const id of ids) {
				if (found.has(id)) this.missing.delete(id)
				else this.missing.set(id, Date.now())
			}
		} catch (error) {
			logger.error("failed to fetch users", error)
			this.setState({ error: error as Error })
		}
	}

	private async requestPresence(ids: string[]): Promise<void> {
		try {
			const data = await UserModel.isUserConnected(ids.join(","))
			const entries = Array.isArray(data) ? data : [data]
			const patch: Record<string, boolean> = {}

			for (const entry of entries) {
				const id = entry?.userId ?? entry?.user_id ?? entry?.id

				if (!id) continue

				patch[String(id)] = Boolean(entry.connected)
			}

			if (Object.keys(patch).length === 0) return

			this.setState((state) => ({
				connections: { ...state.connections, ...patch },
			}))
		} catch (error) {
			logger.error("failed to fetch users presence", error)
		}
	}

	private async requestDecorations(ids: string[]): Promise<void> {
		try {
			const data = await UserModel.decorations.get(ids.join(","))
			const entries = Array.isArray(data)
				? data
				: [{ user_id: ids[0], decorations: data }]

			const now = Date.now()
			const patch: Record<string, SpacesUser> = {}

			for (const entry of entries) {
				const id = entry?.user_id

				if (!id) continue

				const decorations = entry.decorations ?? {}

				this.decorationsSyncedAt.set(id, now)

				const current = this.state.users[id]

				// keep the decorations until the base profile arrives, this
				// avoids exposing a user with only decorations
				if (!current) {
					this.pendingDecorations.set(id, decorations)
					continue
				}

				patch[id] = {
					...current,
					decorations,
					cached_at: current.cached_at ?? now,
				}
			}

			if (Object.keys(patch).length === 0) return

			this.setState((state) => ({
				users: { ...state.users, ...patch },
			}))

			this.persist(Object.values(patch))
		} catch (error) {
			logger.error("failed to fetch user decorations", error)
		}
	}

	private applyPendingDecorations(user: SpacesUser): SpacesUser {
		const decorations = this.pendingDecorations.get(user._id)

		if (!decorations) return user

		this.pendingDecorations.delete(user._id)

		return { ...user, decorations }
	}

	private persist(users: SpacesUser[]): void {
		db.users.bulkPut(users).catch((error) => {
			logger.error("failed to persist users", error)
		})
	}
}
