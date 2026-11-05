import type {
	EnsureUsersOptions,
	SpacesUser,
	UserIdInput,
	UsersStoreType,
} from "./types"

import React from "react"
import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"

import UsersActions from "./actions"
import { idsKey, normalizeIds } from "./helpers"
import { USERS_PRESENCE_REFRESH_MS } from "./constants"
import { getSocket } from "@/helpers/socket"

export const UsersStore = create<UsersStoreType>()((set, get) => {
	const actions = new UsersActions(set, get)

	return {
		users: {},
		connections: {},
		error: null,
		actions,
	}
})

export const usersActions = UsersStore.getState().actions

export function getUser(userId?: string | null): SpacesUser | undefined {
	return userId ? UsersStore.getState().users[userId] : undefined
}

export function setUsers(users: SpacesUser[]): void {
	usersActions.setUsers(users)
}

export function ensureUsers(
	userIds: UserIdInput,
	options?: EnsureUsersOptions,
): Promise<void> {
	return usersActions.ensure(userIds, options)
}

export function ensureUserDecorations(
	userIds: UserIdInput,
	options?: Omit<EnsureUsersOptions, "decorations">,
): Promise<void> {
	return usersActions.ensureDecorations(userIds, options)
}

export function invalidateUsers(userIds?: UserIdInput): void {
	usersActions.invalidate(userIds)
}

export function ensureUsersPresence(userIds: UserIdInput): Promise<void> {
	return usersActions.ensurePresence(userIds)
}

export function resetUsers(): void {
	usersActions.reset()
}

// notice: the ids are serialized so callers can pass a new array on every
// render without triggering effects or extra renders
function useUserIds(userIds: UserIdInput): string[] {
	const key = idsKey(userIds)

	return React.useMemo(() => (key ? key.split(",") : []), [key])
}

export function useUsers(userIds: UserIdInput): Record<string, SpacesUser> {
	const ids = useUserIds(userIds)

	const users = UsersStore(
		useShallow((state) => {
			const result: Record<string, SpacesUser> = {}

			for (const id of ids) {
				const user = state.users[id]

				if (user) result[id] = user
			}

			return result
		}),
	)

	React.useEffect(() => {
		if (ids.length > 0) void usersActions.ensure(ids)
	}, [ids])

	return users
}

export function useUser(
	userId?: string | null,
	options: { enabled?: boolean } = {},
): SpacesUser | undefined {
	const enabled = options.enabled !== false

	const user = UsersStore((state) =>
		userId ? state.users[userId] : undefined,
	)

	React.useEffect(() => {
		if (userId && enabled) void usersActions.ensure(userId)
	}, [userId, enabled])

	return user
}

const EMPTY_IDS: string[] = []

// active presence subscriptions, keyed by user id. the counter lets
// multiple views share the same id without extra requests
const presenceSubscriptions = new Map<string, number>()
let presenceInterval: ReturnType<typeof setInterval> | null = null
let presenceSocket: ReturnType<typeof getSocket> | null = null

function refreshPresence(ids: string[]) {
	if (ids.length === 0) return

	void usersActions.ensurePresence(ids)
}

function refreshAllPresence() {
	refreshPresence(Array.from(presenceSubscriptions.keys()))
}

function startPresenceManager() {
	if (presenceSubscriptions.size === 0) return

	if (!presenceInterval) {
		presenceInterval = setInterval(
			refreshAllPresence,
			USERS_PRESENCE_REFRESH_MS,
		)
	}

	const socket = getSocket()

	if (socket && socket !== presenceSocket) {
		presenceSocket?.off("reconnected", refreshAllPresence)
		socket.on("reconnected", refreshAllPresence)
		presenceSocket = socket
	}
}

function stopPresenceManager() {
	if (presenceSubscriptions.size > 0) return

	if (presenceInterval) {
		clearInterval(presenceInterval)
		presenceInterval = null
	}

	presenceSocket?.off("reconnected", refreshAllPresence)
	presenceSocket = null
}

export function subscribeUsersPresence(userIds: UserIdInput): () => void {
	const ids = normalizeIds(userIds)
	const added: string[] = []

	for (const id of ids) {
		const count = presenceSubscriptions.get(id) ?? 0

		if (count === 0) added.push(id)

		presenceSubscriptions.set(id, count + 1)
	}

	if (added.length > 0) refreshPresence(added)

	startPresenceManager()

	let active = true

	return () => {
		if (!active) return

		active = false

		const removed: string[] = []

		for (const id of ids) {
			const count = presenceSubscriptions.get(id) ?? 0

			if (count <= 1) {
				presenceSubscriptions.delete(id)
				removed.push(id)
			} else {
				presenceSubscriptions.set(id, count - 1)
			}
		}

		if (removed.length > 0) usersActions.clearPresence(removed)

		stopPresenceManager()
	}
}

export type UsersPresenceOptions = {
	// skip fetching while the caller is outside the viewport
	enabled?: boolean
}

export function useUsersPresence(
	userIds: UserIdInput,
	options: UsersPresenceOptions = {},
): Record<string, boolean> {
	const ids = useUserIds(userIds)
	const activeIds = options.enabled === false ? EMPTY_IDS : ids

	const connections = UsersStore(
		useShallow((state) => {
			const result: Record<string, boolean> = {}

			for (const id of ids) {
				if (typeof state.connections[id] === "boolean") {
					result[id] = state.connections[id]
				}
			}

			return result
		}),
	)

	React.useEffect(() => {
		if (activeIds.length === 0) return

		return subscribeUsersPresence(activeIds)
	}, [activeIds])

	return connections
}

export function useUsersActions(): UsersStoreType["actions"] {
	return UsersStore((state) => state.actions)
}

export * from "./types"
