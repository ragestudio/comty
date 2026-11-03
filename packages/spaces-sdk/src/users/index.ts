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
import { idsKey } from "./helpers"

export const UsersStore = create<UsersStoreType>()((set, get) => {
	const actions = new UsersActions(set, get)

	return {
		users: {},
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

export function useUser(userId?: string | null): SpacesUser | undefined {
	const user = UsersStore((state) => (userId ? state.users[userId] : undefined))

	React.useEffect(() => {
		if (userId) void usersActions.ensure(userId)
	}, [userId])

	return user
}

export function useUsersActions(): UsersStoreType["actions"] {
	return UsersStore((state) => state.actions)
}

export * from "./types"
