import { StoreApi } from "zustand"
import { SpacesGroupStoreType } from "../types"

export type SetGroupState = StoreApi<SpacesGroupStoreType>["setState"]
export type GetGroupState = StoreApi<SpacesGroupStoreType>["getState"]
