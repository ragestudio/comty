import type { User } from "@comty/shared/types/user"

export type UserIdInput =
	string | Iterable<string | null | undefined> | null | undefined

export type SpacesUser = Omit<User, "decorations" | "badges"> & {
	cached_at?: number
	// hydrated decoration objects keyed by slot, for example member_bg or avatar
	decorations?: Record<string, any>
	badges?: any[]
}

export type EnsureUsersOptions = {
	force?: boolean
	maxAge?: number
	decorations?: boolean
}

export type UsersPresence = Record<string, boolean>

export interface UsersStoreState {
	users: Record<string, SpacesUser>
	// live presence, never persisted, refetched while a view needs it
	connections: UsersPresence
	error: Error | null
}

export interface UsersStoreActions {
	ensure: (
		userIds: UserIdInput,
		options?: EnsureUsersOptions,
	) => Promise<void>
	ensureDecorations: (
		userIds: UserIdInput,
		options?: Omit<EnsureUsersOptions, "decorations">,
	) => Promise<void>
	setUsers: (users: SpacesUser[], options?: { persist?: boolean }) => void
	setDecorations: (
		userId: string,
		decorations: Record<string, any> | null,
		options?: { persist?: boolean },
	) => void
	patchUser: (
		userId: string,
		patch: Partial<SpacesUser>,
		options?: { persist?: boolean },
	) => void
	hydrateFromCache: (users: SpacesUser[]) => void
	invalidate: (userIds?: UserIdInput) => void
	ensurePresence: (userIds: UserIdInput) => Promise<void>
	setConnection: (userId: string, connected: boolean) => void
	clearPresence: (userIds?: UserIdInput) => void
	reset: () => void
}

export type UsersStoreType = UsersStoreState & {
	actions: UsersStoreActions
}
