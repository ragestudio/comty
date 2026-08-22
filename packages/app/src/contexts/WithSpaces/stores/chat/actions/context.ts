import { StoreApi } from "zustand"
import { SpacesChatState } from "../types"

export type SetChatState = StoreApi<SpacesChatState>["setState"]
export type GetChatState = StoreApi<SpacesChatState>["getState"]
