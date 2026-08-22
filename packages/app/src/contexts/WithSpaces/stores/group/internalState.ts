import type { UserConnectionReference } from "./types"

export const internalState = {
	initGeneration: 0,
	userConnections: new Map<string, UserConnectionReference>(),
	decorationsCache: new Map<string, any>(),
}
